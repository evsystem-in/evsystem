import { Module } from '@nestjs/common';
import { OcppService } from './ocpp.service';
import { OcppController } from './ocpp.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OcppController],
  providers: [OcppService],
})
export class OcppModule {}
