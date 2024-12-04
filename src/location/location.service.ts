import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Location, LocationStatus } from '@prisma/client';
import { PrismaHelpers } from 'src/prisma/prisma-helper.service';

@Injectable()
export class LocationService {
  constructor(
    private prisma: PrismaService,
    private prismaHelpers: PrismaHelpers,
  ) {}

  async createLocation(data: Prisma.LocationCreateInput): Promise<Location> {
    return await this.prismaHelpers.createLocation(data);
  }

  async findAllLocations(params: {
    skip?: number;
    take?: number;
    where?: Prisma.LocationWhereInput;
    orderBy?: Prisma.LocationOrderByWithRelationInput;
  }): Promise<Location[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.location.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        organization: true,
        project: true,
        stations: true,
      },
    });
  }

  async findLocationById(id: string): Promise<Location> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        organization: true,
        project: true,
        stations: true,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async updateLocation(
    id: string,
    data: Prisma.LocationUpdateInput,
  ): Promise<Location> {
    try {
      const location = await this.prisma.location.update({
        where: { id },
        data,
        include: {
          organization: true,
          project: true,
          stations: true,
        },
      });

      return location;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Location with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async deleteLocation(id: string): Promise<Location> {
    try {
      // Check if location has any stations
      const locationWithStations = await this.prisma.location.findUnique({
        where: { id },
        include: { stations: true },
      });

      if (locationWithStations?.stations.length > 0) {
        throw new ConflictException(
          'Cannot delete location that has associated stations',
        );
      }

      return await this.prisma.location.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Location with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
