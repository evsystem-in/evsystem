import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailVerificationService } from './email-verification.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MailController],
  providers: [EmailVerificationService, MailService],
  exports: [EmailVerificationService, MailService],
})
export class MailModule {}
