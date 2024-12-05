import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectorType, ConnectorStatus, Connector } from '@prisma/client';
import { CreateConnectorDto, UpdateConnectorDto } from './dto/connector.dto';


@Injectable()
export class ConnectorService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateConnectorDto): Promise<Connector> {
    const chargingPoint = await this.prisma.chargingPoint.findUnique({
      where: { id: data.chargingPointId },
    });

    if (!chargingPoint) {
      throw new NotFoundException('Charging point not found');
    }

    return this.prisma.connector.create({
      data: {
        ...data,
        status: ConnectorStatus.AVAILABLE,
      },
    });
  }

  async findAll(params: {
    chargingPointId?: string;
    type?: ConnectorType;
    status?: ConnectorStatus;
  }): Promise<Connector[]> {
    return this.prisma.connector.findMany({
      where: params,
      include: {
        chargingPoint: true,
      },
    });
  }

  async findById(id: string): Promise<Connector> {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
      include: {
        chargingPoint: true,
      },
    });

    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    return connector;
  }

  async update(id: string, data: UpdateConnectorDto): Promise<Connector> {
    try {
      return await this.prisma.connector.update({
        where: { id },
        data,
        include: {
          chargingPoint: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Connector not found');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ConnectorStatus): Promise<Connector> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.connector.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Connector not found');
      }
      throw error;
    }
  }
}
