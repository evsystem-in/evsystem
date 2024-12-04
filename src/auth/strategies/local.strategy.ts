import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Configure passport to use email instead of username
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // Attempt to validate the user's credentials
    const user = await this.authService.validateUser(email, password);

    // If validation fails, throw an exception
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If validation succeeds, return the user object
    return user;
  }
}
