import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationStatus, ProjectRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/decorators/roles.guard';
import { ProjectInvitationService } from './project-invite.service';
import { CreateProjectInvitationDto, ProcessInvitationDto } from './dto/project-invite.dto';

@ApiTags('project-invitations')
@Controller('project-invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectInvitationController {
  constructor(
    private readonly projectInvitationService: ProjectInvitationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project invitation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invitation successfully created and email sent',
  })
  async createInvitation(
    @Body() createInvitationDto: CreateProjectInvitationDto,
    @Request() req,
  ) {
    return this.projectInvitationService.createInvitation(
      createInvitationDto,
      req.user.id,
    );
  }

  @Post('process')
  @ApiOperation({ summary: 'Process (accept/reject) a project invitation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation successfully processed',
  })
  async processInvitation(
    @Body() processInvitationDto: ProcessInvitationDto,
    @Request() req,
  ) {
    return this.projectInvitationService.processInvitation(
      processInvitationDto,
      req.user.id,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'List all invitations for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of project invitations',
  })
  async listProjectInvitations(
    @Param('projectId') projectId: string,
    @Query('status') status?: InvitationStatus,
  ) {
    return this.projectInvitationService.listProjectInvitations(
      projectId,
      status,
    );
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend a project invitation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation successfully resent',
  })
  async resendInvitation(@Param('id') id: string, @Request() req) {
    return this.projectInvitationService.resendInvitation(id, req.user.id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a project invitation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation successfully cancelled',
  })
  async cancelInvitation(@Param('id') id: string, @Request() req) {
    return this.projectInvitationService.cancelInvitation(id, req.user.id);
  }
}
