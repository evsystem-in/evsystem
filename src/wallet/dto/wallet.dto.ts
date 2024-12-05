import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class WalletDto {
  @ApiProperty({ example: 100 })
  @Min(0)
  @IsNumber()
  amount: number;
}
