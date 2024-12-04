import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole, ProjectStatus } from '@prisma/client';

// DTOs for project operations
export class CreateProjectDto {
  @ApiProperty({ example: 'Project Demo' })
  name: string;
  @ApiProperty({ example: 'This is a demo project' })
  description?: string;
  @ApiProperty({ example: 'ACTIVE' })
  status?: ProjectStatus;
  @ApiProperty({ example: 'cm49ouxdp00003w73qder0ase' })
  organizationId: string;
}

export class UpdateProjectDto {
  @ApiProperty({ example: 'Project Demo' })
  name?: string;
  @ApiProperty({ example: 'This is a demo project' })
  description?: string;
  @ApiProperty({ example: 'ACTIVE' })
  status?: ProjectStatus;
}

export class AddProjectMemberDto {
  @ApiProperty({ example: 'User ID' })
  userId: string;
  @ApiProperty({ example: 'PROJECT_ADMIN' })
  role: ProjectRole;
}
