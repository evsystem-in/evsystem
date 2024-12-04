import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Station, StationStatus } from '@prisma/client';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async createStation(data: Prisma.StationCreateInput): Promise<Station> {
    try {
      // Check if station with same serial number already exists
      const existingStation = await this.prisma.station.findUnique({
        where: { chargePointSerialNumber: data.chargePointSerialNumber },
      });

      if (existingStation) {
        throw new ConflictException(
          `Station with serial number ${data.chargePointSerialNumber} already exists`,
        );
      }

      // Verify that the location exists
      const location = await this.prisma.location.findUnique({
        where: { id: data.location.connect.id },
      });

      if (!location) {
        throw new NotFoundException(
          `Location with ID ${data.location.connect.id} not found`,
        );
      }

      // Create the station with default status if not provided
      const station = await this.prisma.station.create({
        data: {
          ...data,
          status: data.status || StationStatus.AVAILABLE,
        },
        include: {
          location: true,
          chargingPoints: true,
        },
      });

      return station;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Station serial number must be unique');
        }
      }
      throw error;
    }
  }

  async findAllStations(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StationWhereInput;
    orderBy?: Prisma.StationOrderByWithRelationInput;
  }): Promise<Station[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.station.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        location: true,
        chargingPoints: true,
      },
    });
  }

  async findStationById(id: string): Promise<Station> {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        location: true,
        chargingPoints: true,
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return station;
  }

  async updateStation(
    id: string,
    data: Prisma.StationUpdateInput,
  ): Promise<Station> {
    try {
      const station = await this.prisma.station.update({
        where: { id },
        data,
        include: {
          location: true,
          chargingPoints: true,
        },
      });

      return station;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Station with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Station serial number must be unique');
        }
      }
      throw error;
    }
  }

  async deleteStation(id: string): Promise<Station> {
    try {
      return await this.prisma.station.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Station with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
