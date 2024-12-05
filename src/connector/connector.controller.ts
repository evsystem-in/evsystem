import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  Put,
} from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { CreateConnectorDto, UpdateConnectorDto } from './dto/connector.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConnectorStatus, ConnectorType } from '@prisma/client';

@ApiTags('connectors')
@Controller('connectors')
@UseGuards(JwtAuthGuard)
export class ConnectorController {
  constructor(private connectorService: ConnectorService) {}

  @Post()
  @ApiBearerAuth()
  async create(@Body() createDto: CreateConnectorDto) {
    return this.connectorService.create(createDto);
  }

  @Get()
  @ApiBearerAuth()
  async findAll(
    @Query('chargingPointId') chargingPointId?: string,
    @Query('type') type?: ConnectorType,
    @Query('status') status?: ConnectorStatus,
  ) {
    return this.connectorService.findAll({ chargingPointId, type, status });
  }

  @Get(':id')
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    return this.connectorService.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateDto: UpdateConnectorDto) {
    return this.connectorService.update(id, updateDto);
  }

  @Put(':id/status')
  @ApiBearerAuth()
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConnectorStatus,
  ) {
    return this.connectorService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.connectorService.delete(id);
  }
}
