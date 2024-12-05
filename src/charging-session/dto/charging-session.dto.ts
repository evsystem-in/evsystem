import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  ValidateIf 
} from 'class-validator';
import { ChargingType } from '@prisma/client';

export class StartSessionDto {
  @ApiProperty({
    description: 'ID of the connector to be used for charging',
    example: 'conn_123456'
  })
  @IsString()
  connectorId: string;

  @ApiProperty({
    enum: ChargingType,
    description: 'Type of charging session',
    example: ChargingType.AMOUNT_BASED,
    enumName: 'ChargingType'
  })
  @IsEnum(ChargingType)
  chargingType: ChargingType;

  @ApiPropertyOptional({
    description: 'Target amount in kWh for AMOUNT_BASED charging',
    example: 30,
    minimum: 0.1
  })
  @ValidateIf(o => o.chargingType === ChargingType.AMOUNT_BASED)
  @IsNumber()
  @Min(0.1)
  targetAmount?: number;

  @ApiPropertyOptional({
    description: 'Target duration in minutes for TIME_BASED charging',
    example: 60,
    minimum: 5
  })
  @ValidateIf(o => o.chargingType === ChargingType.TIME_BASED)
  @IsNumber()
  @Min(5)
  targetDuration?: number;

  @ApiPropertyOptional({
    description: 'Initial State of Charge (SoC) percentage',
    example: 20,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialSoC?: number;

  // Optional booking reference if session is started from a booking
  @ApiPropertyOptional({
    description: 'Booking reference ID if starting from a reservation',
    example: 'book_123456'
  })
  @IsOptional()
  @IsString()
  bookingId?: string;
}
