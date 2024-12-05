import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async validateOAuthLogin(profile: any, provider: string) {
    let user = await this.prisma.user.findFirst({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: UserRole.USER,
          emailVerified: new Date(),
          password: '',
          phone: profile.phone ?? '',
          provider: provider,
          providerId: profile.id,
        },
      });
    }

    return this.authService.generateTokens(user);
  }
}
