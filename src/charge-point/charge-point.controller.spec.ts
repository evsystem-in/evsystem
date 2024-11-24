import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointController } from './charge-point.controller';
import { ChargePointService } from './charge-point.service';

describe('ChargePointController', () => {
  let controller: ChargePointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargePointController],
      providers: [ChargePointService],
    }).compile();

    controller = module.get<ChargePointController>(ChargePointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
