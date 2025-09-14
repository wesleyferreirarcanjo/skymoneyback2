import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    console.log(`[DEBUG] AuthController - Login endpoint called with:`, {
      email: loginDto.email,
      password: '[HIDDEN]'
    });

    console.log(`[DEBUG] AuthController - User from LocalAuthGuard:`, req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status
    } : 'undefined');

    const result = await this.authService.login(req.user);

    console.log(`[DEBUG] AuthController - Login response created successfully`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // In a real application, you might want to blacklist the token
    return { message: 'Logged out successfully' };
  }
}