import { StationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class StationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;
}
