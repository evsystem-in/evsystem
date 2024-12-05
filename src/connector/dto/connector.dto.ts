import { ApiProperty } from '@nestjs/swagger';
import { ConnectorStatus, ConnectorType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateConnectorDto {
  @ApiProperty({
    enum: ConnectorType,
    default: ConnectorType.CCS1,
    example: 'CCS1',
  })
  @IsEnum(ConnectorType)
  type: ConnectorType;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  power: number;

  @ApiProperty({ example: 'cm49ouxdp00003w73qder0ase' })
  @IsString()
  chargingPointId: string;
}

export class UpdateConnectorDto {
  @ApiProperty({
    enum: ConnectorType,
    default: ConnectorType.CCS1,
    example: 'CCS1',
  })
  @IsEnum(ConnectorType)
  @IsOptional()
  type?: ConnectorType;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  power?: number;

  @ApiProperty({
    enum: ConnectorStatus,
    default: ConnectorStatus.AVAILABLE,
    example: 'AVAILABLE',
  })
  @IsEnum(ConnectorStatus)
  status: ConnectorStatus;
}
