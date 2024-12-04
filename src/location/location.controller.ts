import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/query-location.dto';
import { Prisma } from '@prisma/client';

@ApiTags('locations')
@Controller('locations')
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location has been successfully created.',
  })
  async createLocation(
    @Body(ValidationPipe) createLocationDto: CreateLocationDto,
  ) {
    const { organizationId, projectId, ...locationData } = createLocationDto;

    return this.locationService.createLocation({
      ...locationData,
      organization: {
        connect: { id: organizationId },
      },
      project: {
        connect: { id: projectId },
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all locations matching the query parameters.',
  })
  async findAllLocations(@Query(ValidationPipe) query: LocationQueryDto) {
    const { search, status, organizationId, projectId, skip, take } = query;

    const where: Prisma.LocationWhereInput = {
      AND: [
        // Search across multiple fields
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { address: { contains: search, mode: 'insensitive' } },
                  { city: { contains: search, mode: 'insensitive' } },
                ] as Prisma.LocationWhereInput['OR'],
              },
            ]
          : []),
        // Status filter
        ...(status ? [{ status }] : []),
        // Organization filter
        ...(organizationId ? [{ organizationId }] : []),
        // Project filter
        ...(projectId ? [{ projectId }] : []),
      ],
    };

    return this.locationService.findAllLocations({
      where,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the location with the specified id.',
  })
  async findLocationById(@Param('id') id: string) {
    return this.locationService.findLocationById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location has been successfully updated.',
  })
  async updateLocation(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location has been successfully deleted.',
  })
  async deleteLocation(@Param('id') id: string) {
    return this.locationService.deleteLocation(id);
  }
}
