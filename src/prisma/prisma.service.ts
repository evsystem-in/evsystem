import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateChargePointDto } from 'src/charge-point/dto/update-charge-point.dto';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  // authorize charging point id
  async authorizeChargePoint(chargePointVendor: string) {
    return await this.chargePoint.findFirstOrThrow({
      where: { chargePointVendor },
    });
  }

  // update charge point
}
