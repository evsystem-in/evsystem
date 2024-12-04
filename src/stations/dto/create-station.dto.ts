import { StationStatus } from '@prisma/client';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateStationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  chargePointVendor: string;

  @IsNotEmpty()
  @IsString()
  chargePointModel: string;

  @IsNotEmpty()
  @IsString()
  chargePointSerialNumber: string;

  @IsNotEmpty()
  @IsString()
  chargeBoxSerialNumber: string;

  @IsNotEmpty()
  @IsString()
  firmwareVersion: string;

  @IsOptional()
  @IsString()
  iccid?: string;

  @IsOptional()
  @IsString()
  imsi?: string;

  @IsNotEmpty()
  @IsString()
  meterType: string;

  @IsNotEmpty()
  @IsString()
  meterSerialNumber: string;

  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @IsNotEmpty()
  @IsString()
  locationId: string;
}
