import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationStatus } from '@prisma/client';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateLocationDto } from './dto/create-location.dto';

describe('LocationController', () => {
  let controller: LocationController;
  let service: LocationService;

  // Mock location data
  const mockLocation = {
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
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: {
            createLocation: jest.fn(),
            findAllLocations: jest.fn(),
            findLocationById: jest.fn(),
            updateLocation: jest.fn(),
            deleteLocation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get<LocationService>(LocationService);
  });

  describe('createLocation', () => {
    it('should create a new location', async () => {
      // Arrange
      const createDto: CreateLocationDto = {
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

      jest.spyOn(service, 'createLocation').mockResolvedValue(mockLocation);

      // Act
      const result = await controller.createLocation(createDto);

      // Assert
      expect(result).toBe(mockLocation);
      expect(service.createLocation).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAllLocations', () => {
    it('should return filtered locations', async () => {
      // Arrange
      const query = {
        search: 'test',
        status: LocationStatus.ACTIVE,
        organizationId: 'org-1',
        skip: 0,
        take: 10,
      };

      jest.spyOn(service, 'findAllLocations').mockResolvedValue([mockLocation]);

      // Act
      const result = await controller.findAllLocations(query);

      // Assert
      expect(result).toEqual([mockLocation]);
      expect(service.findAllLocations).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('findLocationById', () => {
    it('should return a location by id', async () => {
      // Arrange
      jest.spyOn(service, 'findLocationById').mockResolvedValue(mockLocation);

      // Act
      const result = await controller.findLocationById('1');

      // Assert
      expect(result).toBe(mockLocation);
      expect(service.findLocationById).toHaveBeenCalledWith('1');
    });
  });

  describe('updateLocation', () => {
    it('should update a location', async () => {
      // Arrange
      const updateDto: UpdateLocationDto = {
        name: 'Updated Location',
      };
      const updatedLocation = { ...mockLocation, ...updateDto };

      jest.spyOn(service, 'updateLocation').mockResolvedValue(updatedLocation);

      // Act
      const result = await controller.updateLocation('1', updateDto);

      // Assert
      expect(result.name).toBe(updateDto.name);
      expect(service.updateLocation).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('deleteLocation', () => {
    it('should delete a location', async () => {
      // Arrange
      jest.spyOn(service, 'deleteLocation').mockResolvedValue(mockLocation);

      // Act
      const result = await controller.deleteLocation('1');

      // Assert
      expect(result).toBe(mockLocation);
      expect(service.deleteLocation).toHaveBeenCalledWith('1');
    });
  });

  // Test query parameter handling
  describe('query parameter handling', () => {
    it('should properly parse numeric query parameters', async () => {
      // Arrange
      const query = {
        skip: 10,
        take: 20,
        search: 'test',
      };

      jest.spyOn(service, 'findAllLocations').mockResolvedValue([mockLocation]);

      // Act
      await controller.findAllLocations(query);

      // Assert
      expect(service.findAllLocations).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        }),
      );
    });

    it('should handle empty search parameters', async () => {
      // Arrange
      const query = {};

      jest.spyOn(service, 'findAllLocations').mockResolvedValue([mockLocation]);

      // Act
      await controller.findAllLocations(query);

      // Assert
      expect(service.findAllLocations).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.anything(),
        }),
      );
    });
  });

  // Test validation handling
  describe('input validation', () => {
    it('should validate create location payload', async () => {
      // Arrange
      const invalidDto = {
        name: 'Test Location',
        // Missing required fields
      };

      // Act & Assert
      await expect(
        controller.createLocation(invalidDto as any),
      ).rejects.toThrow();
    });
  });
});
