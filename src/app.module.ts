import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OcppModule } from './ocpp/ocpp.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChargePointModule } from './charging-point/charge-point.module';
import { StationsModule } from './stations/stations.module';
import { LocationModule } from './location/location.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { OrgModule } from './org/org.module';
import { ProjectModule } from './project/project.module';
import { ProjectInviteModule } from './project-invite/project-invite.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    OcppModule,
    ChargePointModule,
    StationsModule,
    LocationModule,
    UserModule,
    AuthModule,
    OrgModule,
    ProjectModule,
    ProjectInviteModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
