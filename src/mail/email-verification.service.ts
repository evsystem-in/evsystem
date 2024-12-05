import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async createVerification(email: string, userId: string): Promise<void> {
    const otp = this.generateOTP();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 minutes expiry

    await this.prisma.emailVerification.create({
      data: {
        email,
        userId,
        otpHash: this.generateHash(otp),
        expiresAt: expires,
      },
    });

    await this.mailService.sendVerificationOTP({
      to: email,
      otp,
      expiresAt: expires,
    });
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) return false;

    const isValid = this.generateHash(otp) === verification.otpHash;

    if (isValid) {
      await Promise.all([
        this.prisma.user.update({
          where: { id: verification.userId },
          data: { emailVerified: new Date() },
        }),
        this.prisma.emailVerification.update({
          where: { id: verification.id },
          data: { verified: true },
        }),
      ]);
    }

    return isValid;
  }

  async resendOTP(email: string): Promise<void> {
    const existing = await this.prisma.emailVerification.findFirst({
      where: { email, verified: false },
    });

    if (!existing) throw new Error('No pending verification found');

    // Delete old verification
    await this.prisma.emailVerification.delete({
      where: { id: existing.id },
    });

    // Create new verification
    await this.createVerification(email, existing.userId);
  }
}
