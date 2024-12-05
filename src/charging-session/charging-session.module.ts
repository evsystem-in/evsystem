import { Module } from '@nestjs/common';
import { ChargingSessionService } from './charging-session.service';
import { ChargingSessionController } from './charging-session.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  controllers: [ChargingSessionController],
  providers: [ChargingSessionService],
})
export class ChargingSessionModule {}
