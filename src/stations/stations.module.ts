import { Module } from '@nestjs/common';
import { StationService } from './stations.service';
import { StationController } from './stations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StationController],
  providers: [StationService],
})
export class StationsModule {}
