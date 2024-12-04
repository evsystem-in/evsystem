import { LocationStatus } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

// DTOs
export class CreateLocationDto {
    @IsNotEmpty()
    @IsString()
    name: string;
  
    @IsNotEmpty()
    @IsString()
    address: string;
  
    @IsNotEmpty()
    @IsString()
    city: string;
  
    @IsNotEmpty()
    @IsString()
    state: string;
  
    @IsNotEmpty()
    @IsString()
    country: string;
  
    @IsNotEmpty()
    @IsString()
    zipCode: string;
  
    @IsNotEmpty()
    @IsNumber()
    latitude: number;
  
    @IsNotEmpty()
    @IsNumber()
    longitude: number;
  
    @IsOptional()
    @IsEnum(LocationStatus)
    status?: LocationStatus;
  
    @IsNotEmpty()
    @IsString()
    organizationId: string;
  
    @IsNotEmpty()
    @IsString()
    projectId: string;
  }
  