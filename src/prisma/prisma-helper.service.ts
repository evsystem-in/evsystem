import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Location,
  Station,
  LocationStatus,
  StationStatus,
  Prisma,
  ChargingPointStatus,
} from '@prisma/client';

/**
 * Comprehensive helper functions for Location and Station management
 * These functions handle all database operations with proper error handling
 * and business logic validation
 */
@Injectable()
export class PrismaHelpers {
  constructor(private prisma: PrismaService) {}

  /**
   * Location Management Functions
   */

  async createLocation(
    locationData: Prisma.LocationCreateInput,
  ): Promise<Location> {
    // Step 1: Validate organization if provided
    if (locationData.organization) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: locationData.organization.connect.id },
      });
      if (!organization) {
        throw new Error(
          `Organization not found: ${locationData.organization.connect.id}`,
        );
      }
    }

    // Step 2: Validate project if provided
    if (locationData.project) {
      const project = await this.prisma.project.findUnique({
        where: { id: locationData.project.connect.id },
      });
      if (!project) {
        throw new Error(
          `Project not found: ${locationData.project.connect.id}`,
        );
      }
    }

    // Step 3: Create location with validation and error handling
    try {
      const location = await this.prisma.location.create({
        data: {
          ...locationData,
          status: locationData.status || LocationStatus.ACTIVE,
        },
        include: {
          organization: true,
          project: true,
          stations: true,
        },
      });

      return location;
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }

  async updateLocationStatus(
    locationId: string,
    status: LocationStatus,
    includeStations: boolean = true,
  ): Promise<Location> {
    // Step 1: Start a transaction to update location and related stations
    return await this.prisma.$transaction(async (prisma) => {
      // Step 2: Update location status
      const location = await prisma.location.update({
        where: { id: locationId },
        data: { status },
        include: {
          stations: true,
        },
      });

      // Step 3: If requested, update all associated stations status
      if (includeStations) {
        const stationStatus = this.mapLocationStatusToStationStatus(status);
        await prisma.station.updateMany({
          where: { locationId },
          data: { status: stationStatus },
        });
      }

      return location;
    });
  }

  /**
   * Station Management Functions
   */

  async createStation(
    stationData: Prisma.StationCreateInput,
  ): Promise<Station> {
    // Step 1: Validate location exists and is active
    const location = await this.prisma.location.findUnique({
      where: { id: stationData.location.connect.id },
    });

    if (!location) {
      throw new Error(`Location not found: ${stationData.location.connect.id}`);
    }

    if (location.status !== LocationStatus.ACTIVE) {
      throw new Error(`Location is not active: ${location.name}`);
    }

    // Step 2: Check for duplicate serial number
    const existingStation = await this.prisma.station.findUnique({
      where: { chargePointSerialNumber: stationData.chargePointSerialNumber },
    });

    if (existingStation) {
      throw new Error(
        `Station with serial number ${stationData.chargePointSerialNumber} already exists`,
      );
    }

    // Step 3: Create station with included relationships
    try {
      const station = await this.prisma.station.create({
        data: {
          ...stationData,
          status: stationData.status || StationStatus.AVAILABLE,
        },
        include: {
          location: true,
          chargingPoints: true,
        },
      });

      return station;
    } catch (error) {
      throw new Error(`Failed to create station: ${error.message}`);
    }
  }

  async updateStationStatus(
    stationId: string,
    status: StationStatus,
    includeChargingPoints: boolean = true,
  ): Promise<Station> {
    // Step 1: Start a transaction to update station and related charging points
    return await this.prisma.$transaction(async (prisma) => {
      // Step 2: Update station status
      const station = await prisma.station.update({
        where: { id: stationId },
        data: { status },
        include: {
          chargingPoints: true,
        },
      });

      // Step 3: If requested, update all associated charging points
      if (includeChargingPoints) {
        const chargingPointStatus =
          this.mapStationStatusToChargingPointStatus(status);
        await prisma.chargingPoint.updateMany({
          where: { stationId },
          data: { status: chargingPointStatus },
        });
      }

      return station;
    });
  }

  /**
   * Batch Operations
   */

  async createMultipleStations(
    stationsData: Prisma.StationCreateInput[],
  ): Promise<Station[]> {
    // Step 1: Validate all locations exist and are active
    const locationIds = new Set(stationsData.map((s) => s.location.connect.id));
    const locations = await this.prisma.location.findMany({
      where: { id: { in: Array.from(locationIds) } },
    });

    if (locations.length !== locationIds.size) {
      throw new Error('One or more locations not found');
    }

    const inactiveLocations = locations.filter(
      (l) => l.status !== LocationStatus.ACTIVE,
    );
    if (inactiveLocations.length > 0) {
      throw new Error(
        `Locations not active: ${inactiveLocations.map((l) => l.name).join(', ')}`,
      );
    }

    // Step 2: Validate no duplicate serial numbers
    const serialNumbers = stationsData.map((s) => s.chargePointSerialNumber);
    const existingStations = await this.prisma.station.findMany({
      where: { chargePointSerialNumber: { in: serialNumbers } },
    });

    if (existingStations.length > 0) {
      throw new Error(
        `Duplicate serial numbers found: ${existingStations.map((s) => s.chargePointSerialNumber).join(', ')}`,
      );
    }

    // Step 3: Create all stations in a transaction
    return await this.prisma.$transaction(async (prisma) => {
      const createdStations = await Promise.all(
        stationsData.map((stationData) =>
          prisma.station.create({
            data: {
              ...stationData,
              status: stationData.status || StationStatus.AVAILABLE,
            },
            include: {
              location: true,
              chargingPoints: true,
            },
          }),
        ),
      );

      return createdStations;
    });
  }

  /**
   * Helper Functions
   */

  private mapLocationStatusToStationStatus(
    locationStatus: LocationStatus,
  ): StationStatus {
    const statusMap = {
      [LocationStatus.ACTIVE]: StationStatus.AVAILABLE,
      [LocationStatus.INACTIVE]: StationStatus.OFFLINE,
      [LocationStatus.MAINTENANCE]: StationStatus.MAINTENANCE,
    };
    return statusMap[locationStatus] || StationStatus.OFFLINE;
  }

  private mapStationStatusToChargingPointStatus(
    stationStatus: StationStatus,
  ): ChargingPointStatus {
    const statusMap = {
      [StationStatus.AVAILABLE]: ChargingPointStatus.AVAILABLE,
      [StationStatus.OCCUPIED]: ChargingPointStatus.CHARGING,
      [StationStatus.OFFLINE]: ChargingPointStatus.OFFLINE,
      [StationStatus.MAINTENANCE]: ChargingPointStatus.MAINTENANCE,
    };
    return statusMap[stationStatus] || ChargingPointStatus.OFFLINE;
  }
}
