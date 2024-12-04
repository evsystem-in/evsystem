import { Injectable } from '@nestjs/common';
import { CreateChargePointDto } from './dto/create-charge-point.dto';
import { UpdateChargePointDto } from './dto/update-charge-point.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChargePointService {
  constructor(private readonly prisma: PrismaService) {}

  create(createChargePointDto: Prisma.ChargingPointCreateInput) {
    return this.prisma.chargingPoint.create({ data: createChargePointDto });
  }

  findAll() {
    return this.prisma.chargingPoint.findMany();
  }

  findOne(id: string) {
    try {
      return this.prisma.chargingPoint.findUnique({ where: { id } });
    } catch (error) {
      return { error };
    }
  }

  update(id: number, updateChargePointDto: UpdateChargePointDto) {
    return `This action updates a #${id} chargePoint`;
  }

  remove(id: number) {
    return `This action removes a #${id} chargePoint`;
  }
}
