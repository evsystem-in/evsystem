import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateChargePointDto } from 'src/charging-point/dto/update-charge-point.dto';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  // authorize charging point id

  // update charge point
}
