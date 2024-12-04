import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Organization, Prisma } from '@prisma/client';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(data: CreateOrgDto): Promise<Organization> {
    try {
      // Check for existing organization with same email
      const existingOrg = await this.prisma.organization.findUnique({
        where: { email: data.email },
      });

      if (existingOrg) {
        throw new ConflictException(
          'Organization with this email already exists',
        );
      }

      // Create the organization
      const organization = await this.prisma.organization.create({
        data,
        include: {
          users: true,
          projects: true,
          locations: true,
          billings: true,
        },
      });

      return organization;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Organization with this email already exists',
          );
        }
      }
      throw error;
    }
  }

  async findAllOrganizations(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput;
    includeRelations?: boolean;
  }): Promise<Organization[]> {
    const { skip, take, where, orderBy, includeRelations } = params;

    return this.prisma.organization.findMany({
      skip,
      take,
      where,
      orderBy,
      include: includeRelations
        ? {
            users: true,
            projects: true,
            locations: true,
            billings: true,
          }
        : undefined,
    });
  }

  async findOrganizationById(
    id: string,
    includeRelations: boolean = false,
  ): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: includeRelations
        ? {
            users: true,
            projects: true,
            locations: true,
            billings: true,
          }
        : undefined,
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async updateOrganization(
    id: string,
    data: UpdateOrgDto,
  ): Promise<Organization> {
    try {
      // Check if organization exists
      const existingOrg = await this.findOrganizationById(id);

      // If email is being updated, check for duplicates
      if (data.email && data.email !== existingOrg.email) {
        const duplicateEmail = await this.prisma.organization.findUnique({
          where: { email: data.email },
        });

        if (duplicateEmail) {
          throw new ConflictException(
            'Organization with this email already exists',
          );
        }
      }

      // Update the organization
      const organization = await this.prisma.organization.update({
        where: { id },
        data,
        include: {
          users: true,
          projects: true,
          locations: true,
          billings: true,
        },
      });

      return organization;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Organization with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Organization with this email already exists',
          );
        }
      }
      throw error;
    }
  }

  async deleteOrganization(id: string): Promise<Organization> {
    try {
      // Check if organization has any dependencies
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          users: true,
          projects: true,
          locations: true,
          billings: true,
        },
      });

      if (!organization) {
        throw new NotFoundException(`Organization with ID ${id} not found`);
      }

      // Check for dependencies
      if (organization.users.length > 0) {
        throw new ConflictException(
          'Cannot delete organization with existing users',
        );
      }

      if (organization.projects.length > 0) {
        throw new ConflictException(
          'Cannot delete organization with existing projects',
        );
      }

      // Perform the deletion
      return await this.prisma.organization.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Organization with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  // Additional methods for managing organization relationships

  async addUserToOrganization(
    orgId: string,
    userId: string,
  ): Promise<Organization> {
    try {
      return await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          users: {
            connect: { id: userId },
          },
        },
        include: {
          users: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Organization or user not found');
        }
      }
      throw error;
    }
  }

  async removeUserFromOrganization(
    orgId: string,
    userId: string,
  ): Promise<Organization> {
    try {
      return await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          users: {
            disconnect: { id: userId },
          },
        },
        include: {
          users: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Organization or user not found');
        }
      }
      throw error;
    }
  }
}
