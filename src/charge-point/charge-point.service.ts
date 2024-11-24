import { Injectable } from '@nestjs/common';
import { CreateChargePointDto } from './dto/create-charge-point.dto';
import { UpdateChargePointDto } from './dto/update-charge-point.dto';

@Injectable()
export class ChargePointService {
  create(createChargePointDto: CreateChargePointDto) {
    return 'This action adds a new chargePoint';
  }

  findAll() {
    return `This action returns all chargePoint`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chargePoint`;
  }

  update(id: number, updateChargePointDto: UpdateChargePointDto) {
    return `This action updates a #${id} chargePoint`;
  }

  remove(id: number) {
    return `This action removes a #${id} chargePoint`;
  }
}
