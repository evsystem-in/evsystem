import { LocationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class LocationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;
}
