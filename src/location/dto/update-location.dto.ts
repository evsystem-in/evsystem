import { PartialType } from '@nestjs/swagger';
import { CreateLocationDto } from './create-location.dto';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LocationStatus } from '@prisma/client';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;
}
