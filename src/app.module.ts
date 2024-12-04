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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    OcppModule,
    ChargePointModule,
    StationsModule,
    LocationModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
