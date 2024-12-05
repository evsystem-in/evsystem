import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async addMoney(userId: string, amount: number): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: 0 },
        update: {},
      });

      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          walletId: wallet.id,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return transaction;
    });
  }

  async debitForCharging(
    userId: string,
    amount: number,
    sessionId: string,
  ): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: TransactionType.DEBIT,
          status: TransactionStatus.COMPLETED,
          walletId: wallet.id,
          sessionId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return transaction;
    });
  }
}
