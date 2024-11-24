import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointService } from './charge-point.service';

describe('ChargePointService', () => {
  let service: ChargePointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargePointService],
    }).compile();

    service = module.get<ChargePointService>(ChargePointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
