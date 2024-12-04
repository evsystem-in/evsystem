import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StationStatus } from '@prisma/client';

export class UpdateStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @IsOptional()
  @IsString()
  iccid?: string;

  @IsOptional()
  @IsString()
  imsi?: string;

  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;
}
