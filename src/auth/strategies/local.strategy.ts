import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log(`[DEBUG] LocalStrategy - Validating credentials for: ${email}`);

    const user = await this.authService.validateUser(email, password);

    if (!user) {
      console.log(`[DEBUG] LocalStrategy - Authentication failed for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[DEBUG] LocalStrategy - Authentication successful for: ${email}, user:`, {
      id: user.id,
      email: user.email,
      role: user.role
    });

    return user;
  }
}