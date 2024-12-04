import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ProjectQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;
}
