import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectRole,
  InvitationStatus,
  Prisma,
  ProjectInvitation,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import {
  CreateProjectInvitationDto,
  ProcessInvitationDto,
} from './dto/project-invite.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectInvitationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  // Generate a secure random token for the invitation
  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Calculate expiration date (48 hours from now)
  private getExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 48);
    return expirationDate;
  }

  async createInvitation(
    createInvitationDto: CreateProjectInvitationDto,
    inviterId: string,
  ): Promise<ProjectInvitation> {
    // First verify the inviter has permission to invite (must be PROJECT_ADMIN)
    const inviterMembership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: inviterId,
          projectId: createInvitationDto.projectId,
        },
      },
    });

    if (
      !inviterMembership ||
      inviterMembership.role ! == ProjectRole.PROJECT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only project administrators can send invitations',
      );
    }

    // Check if user is already a member of the project
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        project: { id: createInvitationDto.projectId },
        user: { email: createInvitationDto.email },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    try {
      // Create the invitation with proper includes for email data
      const invitation = await this.prisma.projectInvitation.create({
        data: {
          email: createInvitationDto.email,
          role: createInvitationDto.role,
          status: InvitationStatus.PENDING,
          token: this.generateInvitationToken(),
          expiresAt: this.getExpirationDate(),
          project: {
            connect: { id: createInvitationDto.projectId },
          },
          invitedBy: {
            connect: { id: inviterId },
          },
        },
        include: {
          project: true,
          invitedBy: true,
        },
      });

      // Send the invitation email
      // await this.mailService.sendProjectInvitation({
      //   inviteeName: createInvitationDto.email,
      //   inviterName: inviterMembership.user.name,
      //   projectName: invitation.project.name,
      //   role: invitation.role,
      //   acceptUrl: `${this.configService.get(
      //     'APP_URL',
      //   )}/accept-invite/${invitation.token}`,
      //   rejectUrl: `${this.configService.get(
      //     'APP_URL',
      //   )}/reject-invite/${invitation.token}`,
      //   expiresAt: invitation.expiresAt,
      //   appName: this.configService.get('APP_NAME'),
      //   supportEmail: this.configService.get('SUPPORT_EMAIL'),
      //   year: new Date().getFullYear(),
      // });

      // Generate accept/reject URLs
      await this.mailService.sendProjectInvitation({
        inviteeName: 'skbhati199@gmail.com',
        inviterName: 'Sonu Kumar',
        projectName: 'Awesome Project',
        role: ProjectRole.PROJECT_MANAGER,
        acceptUrl: 'https://your-app.com/accept-invite/token123',
        rejectUrl: 'https://your-app.com/reject-invite/token123',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        appName: 'Your App',
        supportEmail: 'support@your-app.com',
        year: new Date().getFullYear(),
      });

      return invitation;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Invalid invitation data');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Project or inviter not found');
        }
      }
      throw error;
    }
  }

  async processInvitation(
    processInvitationDto: ProcessInvitationDto,
    userId: string,
  ): Promise<ProjectInvitation> {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token: processInvitationDto.token },
      include: {
        project: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation has already been processed');
    }

    if (invitation.expiresAt < new Date()) {
      // Update invitation status to expired
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Begin transaction to process invitation
    return await this.prisma.$transaction(async (prisma) => {
      if (processInvitationDto.action === 'accept') {
        // Create project membership
        await prisma.projectMember.create({
          data: {
            userId: userId,
            projectId: invitation.projectId,
            role: invitation.role,
          },
        });

        // Update invitation status
        return await prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
      } else {
        // Update invitation status to cancelled
        return await prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.CANCELLED },
        });
      }
    });
  }

  async resendInvitation(
    invitationId: string,
    inviterId: string,
  ): Promise<ProjectInvitation> {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: {
        project: true,
        invitedBy: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.invitedById !== inviterId) {
      throw new ForbiddenException(
        'Only the original inviter can resend the invitation',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only resend pending invitations');
    }

    // Update token and expiration
    const updatedInvitation = await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: {
        token: this.generateInvitationToken(),
        expiresAt: this.getExpirationDate(),
      },
      include: {
        project: true,
        invitedBy: true,
      },
    });

    // Resend invitation email
    await this.mailService.sendProjectInvitation({
      inviteeName: 'skbhati199@gmail.com',
      inviterName: 'Sonu Kumar',
      projectName: 'Awesome Project',
      role: ProjectRole.PROJECT_MANAGER,
      acceptUrl: 'https://your-app.com/accept-invite/token123',
      rejectUrl: 'https://your-app.com/reject-invite/token123',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      appName: 'Your App',
      supportEmail: 'support@your-app.com',
      year: new Date().getFullYear(),
    });

    return updatedInvitation;
  }

  async listProjectInvitations(
    projectId: string,
    status?: InvitationStatus,
  ): Promise<ProjectInvitation[]> {
    return this.prisma.projectInvitation.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      include: {
        project: true,
        invitedBy: true,
      },
    });
  }

  async cancelInvitation(
    invitationId: string,
    userId: string,
  ): Promise<ProjectInvitation> {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user has permission to cancel (must be inviter or project admin)
    const hasPermission = await this.prisma.projectMember.findFirst({
      where: {
        projectId: invitation.projectId,
        userId: userId,
        OR: [
          { role: ProjectRole.PROJECT_ADMIN },
          { userId: invitation.invitedById },
        ],
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to cancel invitation',
      );
    }

    return this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.CANCELLED },
    });
  }
}
