import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ProjectRole } from '@prisma/client';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PasswordResetContext, ProjectInvitationContext } from './dto/mail.dto';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize NodeMailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      ignoreTLS: true,
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Initialize templates
    this.loadEmailTemplates();
  }

  // Load and compile email templates during service initialization
  private async loadEmailTemplates() {
    try {
      const templatesDir = path.join(process.cwd(), 'src/mail/templates');

      // Load project invitation template
      const invitationTemplate = await fs.readFile(
        path.join(templatesDir, 'project-invitation.hbs'),
        'utf-8',
      );
      this.templates.set(
        'projectInvitation',
        Handlebars.compile(invitationTemplate),
      );

      // Load password reset template
      const passwordResetTemplate = await fs.readFile(
        path.join(templatesDir, 'password-reset.hbs'),
        'utf-8',
      );
      this.templates.set(
        'passwordReset',
        Handlebars.compile(passwordResetTemplate),
      );

      // Register common Handlebars helpers
      Handlebars.registerHelper('formatDate', function (date: Date) {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      });

      Handlebars.registerHelper('roleToString', function (role: ProjectRole) {
        return role.replace('_', ' ').toLowerCase();
      });
    } catch (error) {
      this.logger.error('Failed to load email templates:', error);
      throw error;
    }
  }

  // Base method for sending emails
  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
        ...options,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  // Send project invitation email
  async sendProjectInvitation(
    context: ProjectInvitationContext,
  ): Promise<void> {
    const template = this.templates.get('projectInvitation');
    if (!template) {
      throw new Error('Project invitation template not found');
    }

    const html = template({
      ...context,
      baseUrl: this.configService.get('APP_URL'),
    });

    await this.sendMail({
      to: context.inviteeName,
      subject: `Invitation to join ${context.projectName}`,
      html,
    });
  }

  // Send password reset email
  async sendPasswordReset(context: PasswordResetContext): Promise<void> {
    const template = this.templates.get('passwordReset');
    if (!template) {
      throw new Error('Password reset template not found');
    }

    const html = template({
      ...context,
      baseUrl: this.configService.get('APP_URL'),
    });

    await this.sendMail({
      to: context.userName,
      subject: 'Reset Your Password',
      html,
    });
  }

  // Verify SMTP connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Failed to verify SMTP connection:', error);
      return false;
    }
  }

  async previewProjectInvitation(context: ProjectInvitationContext) {
    const template = this.templates.get('projectInvitation');
    if (!template) {
      throw new Error('Project invitation template not found');
    }

    const html = template({
      ...context,
      baseUrl: this.configService.get('APP_URL'),
    });

    return this.sendMail({
      to: context.inviteeName,
      subject: `Invitation to join ${context.projectName}`,
      html,
    });
  }

  async previewPasswordReset(context: PasswordResetContext) {
    const template = this.templates.get('passwordReset');
    if (!template) {
      throw new Error('Password reset template not found');
    }

    const html = template({
      ...context,
      baseUrl: this.configService.get('APP_URL'),
    });

    return this.sendMail({
      to: context.userName,
      subject: 'Reset Your Password',
      html,
    });
  }

  async sendVerificationOTP(context: {
    to: string;
    otp: string;
    expiresAt: Date;
  }) {
    await this.sendMail({
      to: context.to,
      subject: 'Verify Your Email',
      html: `Your verification code is: ${context.otp}`,
    });
  }
}
