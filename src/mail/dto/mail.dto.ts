import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsString } from 'class-validator';

export interface EmailBaseContext {
  appName: string;
  supportEmail: string;
  year: number;
}

export interface ProjectInvitationContext extends EmailBaseContext {
  inviteeName: string;
  inviterName: string;
  projectName: string;
  role: String;
  expiresAt: Date;
  acceptUrl?: string; // Made optional since we might generate these URLs internally
  rejectUrl?: string; // Made optional since we might generate these URLs internally
}

// to: user.email,
//       userName: `${user.firstName} ${user.lastName}`,
//       resetUrl: `${this.configService.get('APP_URL')}/reset-password?token=${token}`,
//       expiresAt: expires,
//       appName: this.configService.get('APP_NAME'),
//       supportEmail: this.configService.get('SUPPORT_EMAIL'),
//       year: new Date().getFullYear(),

export interface PasswordResetContext extends EmailBaseContext {
  to: string;
  userName: string;
  resetUrl: string;
  expiresAt: Date;
  appName: string;
  supportEmail: string;
  year: number;
}

export class TestProjectInvitationDto
  implements Partial<ProjectInvitationContext>
{
  @ApiProperty({ example: 'skbhati199@gmail.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'sk' })
  @IsString()
  inviterName: string;

  @ApiProperty({ example: 'Project Demo' })
  @IsString()
  projectName: string;

  @ApiProperty({ example: 'PROJECT_ADMIN' })
  @IsEnum(ProjectRole)
  role: ProjectRole;

  @ApiProperty({ example: '2023-01-01' })
  @IsDateString()
  expiresAt: Date;
}

// DTOs for email testing and preview

export class TestPasswordResetDto implements Partial<PasswordResetContext> {
  @IsEmail()
  to: string;

  @IsString()
  userName: string;

  @IsDateString()
  expiresAt: Date;
}
