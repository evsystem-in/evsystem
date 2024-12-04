import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Prisma, ProjectRole, ProjectStatus, UserRole } from '@prisma/client';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { RolesGuard } from 'src/auth/decorators/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { ProjectQueryDto } from './dto/query-project.dto';
import { AddProjectMemberDto, CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project successfully created',
  })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    return this.projectService.createProject(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all accessible projects',
  })
  async findAllProjects(@Query() query: ProjectQueryDto, @Request() req) {
    const { search, status, organizationId, skip, take } = query;

    const where: Prisma.ProjectWhereInput = {
      AND: [
        // Search conditions
        ...(search
          ? [
              {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: 'insensitive' as Prisma.QueryMode,
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: 'insensitive' as Prisma.QueryMode,
                    },
                  },
                ] as Prisma.ProjectWhereInput['OR'],
              },
            ]
          : []),
        // Status condition
        ...(status ? [{ status }] : []),
      ] as Prisma.ProjectWhereInput['AND'],
    };

    return this.projectService.findAllProjects({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: { createdAt: 'desc' },
      userId: req.user.id,
      organizationId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the project' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async findProjectById(@Param('id') id: string) {
    return this.projectService.findProjectById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    return this.projectService.updateProject(id, updateProjectDto, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member added to project',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async addProjectMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddProjectMemberDto,
    @Request() req,
  ) {
    return this.projectService.addProjectMember(id, addMemberDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member removed from project',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project member not found',
  })
  async removeProjectMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.projectService.removeProjectMember(id, memberId, req.user.id);
  }

  @Put(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role in project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member role updated' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project member not found',
  })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body('role') role: ProjectRole,
    @Request() req,
  ) {
    return this.projectService.updateMemberRole(
      id,
      memberId,
      role,
      req.user.id,
    );
  }
}
