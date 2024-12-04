import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus, ProjectRole, Prisma } from '@prisma/client';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async createProject(
    data: CreateProjectDto,
    creatorId: string,
  ): Promise<Project> {
    try {
      // Verify organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: data.organizationId },
        include: {
          users: {
            where: { id: creatorId },
          },
        },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID ${data.organizationId} not found`,
        );
      }

      // Verify creator belongs to organization
      if (organization.users.length === 0) {
        throw new ForbiddenException(
          'User does not belong to this organization',
        );
      }

      // Create project with initial member (creator as PROJECT_ADMIN)
      const project = await this.prisma.project.create({
        data: {
          ...data,
          members: {
            create: {
              userId: creatorId,
              role: ProjectRole.PROJECT_ADMIN,
            },
          },
        },
        include: {
          organization: true,
          members: {
            include: {
              user: true,
            },
          },
          locations: true,
        },
      });

      return project;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Project name already exists in this organization',
          );
        }
      }
      throw error;
    }
  }

  async findAllProjects(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
    userId?: string;
    organizationId?: string;
  }): Promise<Project[]> {
    const { skip, take, where, orderBy, userId, organizationId } = params;

    // Build the where clause with user and organization filters
    const finalWhere: Prisma.ProjectWhereInput = {
      ...where,
      ...(userId && {
        members: {
          some: {
            userId,
          },
        },
      }),
      ...(organizationId && {
        organizationId,
      }),
    };

    return this.prisma.project.findMany({
      skip,
      take,
      where: finalWhere,
      orderBy,
      include: {
        organization: true,
        members: {
          include: {
            user: true,
          },
        },
        locations: true,
      },
    });
  }

  async findProjectById(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organization: true,
        members: {
          include: {
            user: true,
          },
        },
        locations: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async updateProject(
    id: string,
    data: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    // Verify user's role in project
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: id,
        },
      },
    });

    // Check if user has appropriate role for project updates
    const allowedRoles = [
      ProjectRole.PROJECT_ADMIN,
      ProjectRole.PROJECT_MANAGER,
    ];
    const isAllow =
      allowedRoles.find((role) => role === member.role).length > 0;
    if (!member || !isAllow) {
      throw new ForbiddenException(
        'Insufficient permissions to update project',
      );
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data,
        include: {
          organization: true,
          members: {
            include: {
              user: true,
            },
          },
          locations: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Project with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async addProjectMember(
    projectId: string,
    data: AddProjectMemberDto,
    adminId: string,
  ): Promise<Project> {
    // Verify admin's role
    const adminMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: adminId,
          projectId,
        },
      },
    });

    if (!adminMember || adminMember.role !== ProjectRole.PROJECT_ADMIN) {
      throw new ForbiddenException('Only project admins can add members');
    }

    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          members: {
            create: {
              userId: data.userId,
              role: data.role,
            },
          },
        },
        include: {
          organization: true,
          members: {
            include: {
              user: true,
            },
          },
          locations: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'User is already a member of this project',
          );
        }
      }
      throw error;
    }
  }

  async removeProjectMember(
    projectId: string,
    memberId: string,
    adminId: string,
  ): Promise<Project> {
    // Verify admin's role
    const adminMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: adminId,
          projectId,
        },
      },
    });

    if (!adminMember || adminMember.role !== ProjectRole.PROJECT_ADMIN) {
      throw new ForbiddenException('Only project admins can remove members');
    }

    // Prevent removing the last admin
    const adminCount = await this.prisma.projectMember.count({
      where: {
        projectId,
        role: ProjectRole.PROJECT_ADMIN,
      },
    });

    if (adminCount === 1 && memberId === adminId) {
      throw new ForbiddenException('Cannot remove the last project admin');
    }

    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          members: {
            delete: {
              userId_projectId: {
                userId: memberId,
                projectId,
              },
            },
          },
        },
        include: {
          organization: true,
          members: {
            include: {
              user: true,
            },
          },
          locations: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project member not found');
        }
      }
      throw error;
    }
  }

  async updateMemberRole(
    projectId: string,
    memberId: string,
    role: ProjectRole,
    adminId: string,
  ): Promise<Project> {
    // Verify admin's role
    const adminMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: adminId,
          projectId,
        },
      },
    });

    if (!adminMember || adminMember.role !== ProjectRole.PROJECT_ADMIN) {
      throw new ForbiddenException(
        'Only project admins can update member roles',
      );
    }

    // Prevent removing the last admin
    if (adminId === memberId && role !== ProjectRole.PROJECT_ADMIN) {
      const adminCount = await this.prisma.projectMember.count({
        where: {
          projectId,
          role: ProjectRole.PROJECT_ADMIN,
        },
      });

      if (adminCount === 1) {
        throw new ForbiddenException('Cannot demote the last project admin');
      }
    }

    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          members: {
            update: {
              where: {
                userId_projectId: {
                  userId: memberId,
                  projectId,
                },
              },
              data: { role },
            },
          },
        },
        include: {
          organization: true,
          members: {
            include: {
              user: true,
            },
          },
          locations: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Project member not found');
        }
      }
      throw error;
    }
  }
}
