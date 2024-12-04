import { Module } from '@nestjs/common';
import { ProjectInvitationController } from './project-invite.controller';
import { ProjectInvitationService } from './project-invite.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [PrismaModule, ConfigModule, MailModule],
  controllers: [ProjectInvitationController],
  providers: [ProjectInvitationService],
})
export class ProjectInviteModule {}
