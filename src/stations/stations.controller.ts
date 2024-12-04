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
import { Prisma } from '@prisma/client';
import { StationService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { StationQueryDto } from './dto/query-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

// DTOs

@ApiTags('stations')
@Controller('stations')
@ApiBearerAuth()
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new station' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The station has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Station already exists.',
  })
  async createStation(
    @Body(ValidationPipe) createStationDto: CreateStationDto,
  ) {
    return this.stationService.createStation({
      ...createStationDto,
      location: {
        connect: { id: createStationDto.locationId },
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all stations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all stations matching the query parameters.',
  })
  async findAllStations(@Query(ValidationPipe) query: StationQueryDto) {
    const { search, status, locationId, skip, take } = query;

    const where: Prisma.StationWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            chargePointSerialNumber: { contains: search, mode: 'insensitive' },
          },
        ],
      }),
      ...(status && { status }),
      ...(locationId && { locationId }),
    };

    return this.stationService.findAllStations({
      where,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a station by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the station with the specified id.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Station not found.',
  })
  async findStationById(@Param('id') id: string) {
    return this.stationService.findStationById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a station' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The station has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Station not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input.',
  })
  async updateStation(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStationDto: UpdateStationDto,
  ) {
    return this.stationService.updateStation(id, updateStationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a station' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The station has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Station not found.',
  })
  async deleteStation(@Param('id') id: string) {
    return this.stationService.deleteStation(id);
  }
}
