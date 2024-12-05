import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { TokenResponse } from './dto/auth-response';
import { RegisterDto } from './dto/auth.dto';
import { EmailVerificationService } from 'src/mail/email-verification.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

// Define types for JWT payload and tokens
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService,
    private mailService: MailService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  // auth/auth.service.ts
  async register(registerDto: RegisterDto): Promise<TokenResponse> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
      include: {
        organization: true,
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    try {
      // Create the user
      const newUser = await this.prisma.user.create({
        data: {
          ...registerDto,
          role: registerDto.role,
          password: hashedPassword,
          Wallet: {
            create: {
              balance: 50,
            },
          },
        },
        include: {
          Wallet: true,
        },
      });

      // Generate tokens for the new user
      const tokens = await this.generateTokens(newUser);

      // Remove password from user object
      const { password, ...userWithoutPassword } = newUser;
      await this.emailVerificationService.createVerification(
        registerDto.email,
        newUser.id,
      );
      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  // Validate user credentials and return tokens if valid
  async validateUser(
    email: string,
    password: string,
    provider?: string,
  ): Promise<any> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        Wallet: true,
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    if (user.provider == provider) {
      return user;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...result } = user;

    return result;
  }

  // Generate access and refresh tokens
  async generateTokens(user: any): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate tokens with different expiration times
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '7d', // Short-lived access token
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '30d', // Longer-lived refresh token
      }),
    ]);

    // Store refresh token hash in database
    const userResponse = await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    const { password, ...userWithoutPassword } = userResponse;

    delete userWithoutPassword.refreshToken;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  // Validate refresh token and generate new access token
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  // Logout user by invalidating refresh token
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // Verify email/password reset token
  async verifyResetToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      return false;
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      type: 'password-reset',
    };

    return this.jwtService.signAsync(payload, { expiresIn: '1h' });
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) return;

      const token = crypto.randomUUID().replaceAll('-', '');

      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: await bcrypt.hash(token, 10),
          expiresAt: expires,
        },
      });

      await this.mailService.sendPasswordReset({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        resetUrl: `${this.configService.get('APP_URL')}/reset-password?token=${token}`,
        expiresAt: expires,
        appName: this.configService.get('APP_NAME'),
        supportEmail: this.configService.get('SUPPORT_EMAIL'),
        year: new Date().getFullYear(),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async getMe(user: any) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Wallet: true,
        organization: true,
      },
    });

    delete dbUser.password;

    return dbUser;
  }
}
