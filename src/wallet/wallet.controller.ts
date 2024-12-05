import { Controller, Post, Body, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('topup')
  async addMoney(@Req() req, @Body() body: { amount: number }) {
    return this.walletService.addMoney(req.user.id, body.amount);
  }
}
