import { Test, TestingModule } from '@nestjs/testing';
import { ChargingSessionService } from './charging-session.service';

describe('ChargingSessionService', () => {
  let service: ChargingSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargingSessionService],
    }).compile();

    service = module.get<ChargingSessionService>(ChargingSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
