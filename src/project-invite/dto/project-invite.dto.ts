import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

// DTOs for invitation operations
export class CreateProjectInvitationDto {
  @ApiProperty({ example: 'sk@sk.com' })
  email: string;
  @ApiProperty({ example: 'PROJECT_ADMIN' })
  role: ProjectRole;
  @ApiProperty({ example: 'cm49ouxdp00003w73qder0ase' })
  projectId: string;
}

export class ProcessInvitationDto {
  @ApiProperty({ example: 'token' })
  token: string;
  @ApiProperty({ example: 'accept' })
  action: 'accept' | 'reject';
}
