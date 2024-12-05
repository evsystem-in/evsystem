import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiProperty } from '@nestjs/swagger';
import { WalletDto } from './dto/wallet.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('topup')
  async addMoney(@Req() req, @Body() body: WalletDto) {
    console.log(req.user);
    return this.walletService.addMoney(req.user.id, body.amount);
  }
}
