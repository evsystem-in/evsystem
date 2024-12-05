import { BadRequestException, Injectable } from '@nestjs/common';
import { StartSessionDto } from './dto/charging-session.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import {
  ChargingSession,
  ChargingSessionStatus,
  ChargingType,
  ConnectorStatus,
} from '@prisma/client';

@Injectable()
export class ChargingSessionService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async startSession(data: {
    userId: string;
    connectorId: string;
    chargingType: ChargingType;
    targetAmount?: number;
    targetDuration?: number;
  }): Promise<ChargingSession> {
    // First verify the connector
    const connector = await this.prisma.connector.findUnique({
      where: { id: data.connectorId },
    });

    if (!connector || connector.status !== ConnectorStatus.AVAILABLE) {
      throw new BadRequestException('Connector not available');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create the charging session with proper Prisma input type
      const session = await tx.chargingSession.create({
        data: {
          status: ChargingSessionStatus.INITIATED,
          startTime: new Date(),
          chargingType: data.chargingType,
          pricePerKwh: 10,
          pricePerMinute: 0.5,
          currency: 'USD',
          // Connect the relationships properly
          user: {
            connect: { id: data.userId },
          },
          connector: {
            connect: { id: data.connectorId },
          },
          chargingPoint: {
            connect: { id: connector.chargingPointId },
          },
          // Optional fields
          ...(data.targetAmount && { targetAmount: data.targetAmount }),
          ...(data.targetDuration && { targetDuration: data.targetDuration }),
        },
      });

      // Update connector status
      await tx.connector.update({
        where: { id: data.connectorId },
        data: { status: ConnectorStatus.IN_USE },
      });

      return session;
    });
  }

  async endSession(sessionId: string): Promise<ChargingSession> {
    const session = await this.prisma.chargingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== ChargingSessionStatus.CHARGING) {
      throw new BadRequestException('Invalid session');
    }

    const endTime = new Date();
    const duration = Math.ceil(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );
    const totalEnergy = 10.5; // Get from charging point
    const totalCost = this.calculateCost(session, totalEnergy, duration);

    // Debit wallet
    await this.walletService.debitForCharging(
      session.userId,
      totalCost,
      session.id,
    );

    return this.prisma.$transaction(async (tx) => {
      // Update session
      const updatedSession = await tx.chargingSession.update({
        where: { id: sessionId },
        data: {
          status: ChargingSessionStatus.COMPLETED,
          endTime,
          totalEnergy,
          totalCost,
        },
      });

      // Free connector
      await tx.connector.update({
        where: { id: session.connectorId },
        data: { status: ConnectorStatus.AVAILABLE },
      });

      return updatedSession;
    });
  }

  private calculateCost(
    session: ChargingSession,
    energy: number,
    duration: number,
  ): number {
    return energy * session.pricePerKwh + duration * session.pricePerMinute;
  }

  // Custom validator to ensure required fields based on charging type
  async ValidateChargingParameters(value: StartSessionDto) {
    if (
      value.chargingType === ChargingType.AMOUNT_BASED &&
      !value.targetAmount
    ) {
      return false;
    }
    if (
      value.chargingType === ChargingType.TIME_BASED &&
      !value.targetDuration
    ) {
      return false;
    }
    return true;
  }
}
