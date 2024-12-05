import { Test, TestingModule } from '@nestjs/testing';
import { ChargingSessionController } from './charging-session.controller';
import { ChargingSessionService } from './charging-session.service';

describe('ChargingSessionController', () => {
  let controller: ChargingSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargingSessionController],
      providers: [ChargingSessionService],
    }).compile();

    controller = module.get<ChargingSessionController>(ChargingSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
