import { Module } from '@nestjs/common';
import { ChargePointService } from './charge-point.service';
import { ChargePointController } from './charge-point.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChargePointController],
  providers: [ChargePointService],
})
export class ChargePointModule {}
