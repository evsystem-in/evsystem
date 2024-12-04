import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/decorators/roles.guard';
import { Prisma, UserRole } from '@prisma/client';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Roles } from 'src/auth/guards/roles.decorator';
import { OrgQueryDto } from './dto/query-org.dto';
import { OrgService } from './org.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Organization successfully created',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization with this email already exists',
  })
  async createOrganization(@Body() createOrgDto: CreateOrgDto) {
    return this.orgService.createOrganization(createOrgDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all organizations',
  })
  async findAllOrganizations(@Query() query: OrgQueryDto) {
    const { search, skip, take, orderBy, includeRelations } = query;

    const where: Prisma.OrganizationWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const orderByObject: Prisma.OrganizationOrderByWithRelationInput = orderBy
      ? {
          [orderBy]: 'asc',
        }
      : { createdAt: 'desc' };

    return this.orgService.findAllOrganizations({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: orderByObject,
      includeRelations,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the organization',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  async findOrganizationById(
    @Param('id') id: string,
    @Query('includeRelations') includeRelations?: boolean,
  ) {
    return this.orgService.findOrganizationById(id, includeRelations);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an organization' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organization updated' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrgDto,
  ) {
    return this.orgService.updateOrganization(id, updateOrgDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organization deleted' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete organization with dependencies',
  })
  async deleteOrganization(@Param('id') id: string) {
    return this.orgService.deleteOrganization(id);
  }

  @Post(':id/users/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add user to organization' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User added to organization',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or user not found',
  })
  async addUserToOrganization(
    @Param('id') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.orgService.addUserToOrganization(orgId, userId);
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove user from organization' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User removed from organization',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or user not found',
  })
  async removeUserFromOrganization(
    @Param('id') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.orgService.removeUserFromOrganization(orgId, userId);
  }
}
