import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';
import { Location, LocationStatus, Prisma } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LocationService', () => {
  let service: LocationService;
  let prismaService: PrismaService;

  // Mock location data for testing
  const mockLocation: Location = {
    id: '1',
    name: 'Test Location',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    zipCode: '12345',
    latitude: 40.7128,
    longitude: -74.006,
    status: LocationStatus.ACTIVE,
    organizationId: 'org-1',
    projectId: 'proj-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: PrismaService,
          useValue: {
            location: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
            project: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createLocation', () => {
    it('should successfully create a location', async () => {
      // Arrange
      const createDto = {
        name: 'New Location',
        address: '123 Street',
        city: 'City',
        state: 'State',
        country: 'Country',
        zipCode: '12345',
        latitude: 40.7128,
        longitude: -74.006,
        organizationId: 'org-1',
        projectId: 'proj-1',
      };

      jest
        .spyOn(prismaService.organization, 'findUnique')
        .mockResolvedValue({ id: 'org-1', name: 'Test Org' } as any);
      jest
        .spyOn(prismaService.project, 'findUnique')
        .mockResolvedValue({ id: 'proj-1', name: 'Test Project' } as any);
      jest
        .spyOn(prismaService.location, 'create')
        .mockResolvedValue({ ...mockLocation, ...createDto });

      // Act
      const result = await service.createLocation(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.status).toBe(LocationStatus.ACTIVE);
      expect(prismaService.location.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization not found', async () => {
      // Arrange
      jest
        .spyOn(prismaService.organization, 'findUnique')
        .mockResolvedValue(null);

      let organization = { id: 'org-1', name: 'Test Org' } as any;
      // Act & Assert
      await expect(
        service.createLocation({
          ...mockLocation,
          organization: organization,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllLocations', () => {
    it('should return array of locations with filters', async () => {
      // Arrange
      const mockLocations = [mockLocation];
      const params = {
        skip: 0,
        take: 10,
        where: { status: LocationStatus.ACTIVE },
      };

      jest
        .spyOn(prismaService.location, 'findMany')
        .mockResolvedValue(mockLocations);

      // Act
      const result = await service.findAllLocations(params);

      // Assert
      expect(result).toEqual(mockLocations);
      expect(prismaService.location.findMany).toHaveBeenCalledWith(params);
    });
  });

  describe('findLocationById', () => {
    it('should return a single location', async () => {
      // Arrange
      jest
        .spyOn(prismaService.location, 'findUnique')
        .mockResolvedValue(mockLocation);

      // Act
      const result = await service.findLocationById('1');

      // Assert
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException when location not found', async () => {
      // Arrange
      jest.spyOn(prismaService.location, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findLocationById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLocation', () => {
    it('should successfully update a location', async () => {
      // Arrange
      const updateDto = { name: 'Updated Location' };
      const updatedLocation = { ...mockLocation, ...updateDto };

      jest
        .spyOn(prismaService.location, 'update')
        .mockResolvedValue(updatedLocation);

      // Act
      const result = await service.updateLocation('1', updateDto);

      // Assert
      expect(result.name).toBe(updateDto.name);
      expect(prismaService.location.update).toHaveBeenCalled();
    });
  });

  describe('deleteLocation', () => {
    it('should successfully delete a location with no stations', async () => {
      // Arrange
      jest
        .spyOn(prismaService.location, 'findUnique')
        .mockResolvedValue({ ...mockLocation });
      jest
        .spyOn(prismaService.location, 'delete')
        .mockResolvedValue(mockLocation);

      // Act
      const result = await service.deleteLocation('1');

      // Assert
      expect(result).toEqual(mockLocation);
    });

    it('should throw ConflictException when trying to delete location with stations', async () => {
      // Arrange
      jest.spyOn(prismaService.location, 'findUnique').mockResolvedValue({
        ...mockLocation,
      });

      // Act & Assert
      await expect(service.deleteLocation('1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
