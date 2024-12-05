import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole, ProjectRole } from '@prisma/client';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { RolesGuard } from 'src/auth/decorators/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import {
  PasswordResetContext,
  ProjectInvitationContext,
  TestPasswordResetDto,
  TestProjectInvitationDto,
} from './dto/mail.dto';
import { EmailVerificationService } from './email-verification.service';

@ApiTags('mail')
@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly verificationService: EmailVerificationService,
  ) {}

  @Post('test/project-invitation')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a test project invitation email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email data provided',
  })
  async sendTestProjectInvitation(@Body() testDto: TestProjectInvitationDto) {
    try {
      // Generate test data for email context
      const emailContext: ProjectInvitationContext = {
        ...testDto,
        inviteeName: testDto.to,
        appName: 'Test Environment',
        supportEmail: 'support@evsystem.com',
        year: new Date().getFullYear(),
      };

      await this.mailService.sendProjectInvitation(emailContext);

      return {
        success: true,
        message: 'Test project invitation email sent successfully',
        recipient: testDto.to,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send test email: ${error.message}`,
      );
    }
  }

  @Post('test/password-reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a test password reset email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test email sent successfully',
  })
  async sendTestPasswordReset(@Body() testDto: TestPasswordResetDto) {
    try {
      // Generate test data for email context
      const emailContext: PasswordResetContext = {
        ...testDto,
        appName: 'Test Environment',
        supportEmail: 'support@test.com',
        year: new Date().getFullYear(),
        resetUrl: 'https://test.com/reset-password/test-token',
      };

      await this.mailService.sendPasswordReset(emailContext);

      return {
        success: true,
        message: 'Test password reset email sent successfully',
        recipient: testDto.to,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send test email: ${error.message}`,
      );
    }
  }

  @Get('verify-connection')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify SMTP connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection status',
  })
  async verifyConnection() {
    const isConnected = await this.mailService.verifyConnection();

    return {
      success: isConnected,
      message: isConnected
        ? 'SMTP connection verified successfully'
        : 'Failed to verify SMTP connection',
    };
  }

  @Get('preview/project-invitation')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Preview project invitation email template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the rendered HTML template',
  })
  async previewProjectInvitation(@Query() testDto: TestProjectInvitationDto) {
    try {
      // Generate preview data
      const previewContext: ProjectInvitationContext = {
        ...testDto,
        inviteeName: testDto.to,
        appName: 'Preview Environment',
        supportEmail: 'support@preview.com',
        year: new Date().getFullYear(),
      };

      // Get template HTML without sending
      return await this.mailService.previewProjectInvitation(previewContext);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate preview: ${error.message}`,
      );
    }
  }

  @Get('preview/password-reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Preview password reset email template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the rendered HTML template',
  })
  async previewPasswordReset(@Query() testDto: TestPasswordResetDto) {
    try {
      // Generate preview data
      const previewContext: PasswordResetContext = {
        ...testDto,
        appName: 'Preview Environment',
        supportEmail: 'support@preview.com',
        year: new Date().getFullYear(),
        resetUrl: 'https://preview.com/reset-password/preview-token',
      };

      // Get template HTML without sending
      return await this.mailService.previewPasswordReset(previewContext);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate preview: ${error.message}`,
      );
    }
  }

  @Post('verify')
  async verifyEmail(@Body() body: { email: string; otp: string }) {
    const isValid = await this.verificationService.verifyOTP(
      body.email,
      body.otp,
    );
    if (!isValid) throw new UnauthorizedException('Invalid or expired OTP');
    return { message: 'Email verified successfully' };
  }

  @Post('resend')
  async resendOTP(@Body() body: { email: string }) {
    await this.verificationService.resendOTP(body.email);
    return { message: 'New OTP sent' };
  }
}
