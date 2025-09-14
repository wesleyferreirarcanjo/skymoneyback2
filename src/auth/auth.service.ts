import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log(`[DEBUG] Validating user: ${email}`);

    const user = await this.usersService.findByEmail(email);
    console.log(`[DEBUG] User found:`, user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      password: user.password ? '[HASHED]' : '[NULL]'
    } : 'null');

    if (user && await this.usersService.validatePassword(user, password)) {
      console.log(`[DEBUG] Password validation successful`);
      const { password, ...result } = user;
      console.log(`[DEBUG] Returning user data:`, {
        id: result.id,
        email: result.email,
        role: result.role,
        status: result.status
      });
      return result;
    }

    console.log(`[DEBUG] Password validation failed or user not found`);
    return null;
  }

  async login(user: User) {
    console.log(`[DEBUG] Creating login token for user:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    console.log(`[DEBUG] JWT payload:`, payload);

    const token = this.jwtService.sign(payload);
    console.log(`[DEBUG] JWT token created successfully`);

    const response = {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    };

    console.log(`[DEBUG] Login response:`, {
      ...response,
      access_token: '[JWT_TOKEN]'
    });

    return response;
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.login(user);
  }

  async refreshToken(user: User) {
    return this.login(user);
  }
}