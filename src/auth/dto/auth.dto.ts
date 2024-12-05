import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// DTOs for request validation
export class LoginDto {
  @ApiProperty({ example: 'skbhati199@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'skbhati199@gmail.com' })
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'sk@sk.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sonu' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Kumar' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '123456!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'skbhati199@gmail.com!' })
  @IsEmail()
  @IsString()
  email: string;
}
