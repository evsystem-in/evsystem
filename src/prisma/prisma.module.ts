import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaHelpers } from './prisma-helper.service';

@Module({
  controllers: [],
  providers: [PrismaService, PrismaHelpers],
  exports: [PrismaService, PrismaHelpers],
})
export class PrismaModule {}
