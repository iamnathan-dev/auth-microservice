import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { LoginUserDto } from 'src/dto/login-user.dto';
import { AuthService } from 'src/services/auth/auth.service';
import { JwtAuthGuard } from './jw-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.authService.createUser(dto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUserDto) {
    return await this.authService.loginUser(dto);
  }

  @Post('/verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    return await this.authService.verifyEmail(token);
  }

  @Post('/resend-email')
  @HttpCode(HttpStatus.OK)
  async resendEmail(@Body('email') email: string, @Body('type') type: string) {
    if (!email || !type) {
      throw new BadRequestException('Email and type are required');
    }
    return await this.authService.resendEmail(email, type);
  }

  @Post('/forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return await this.authService.forgetPassword(email);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }
    return await this.authService.resetPassword(token, newPassword);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return await this.authService.logoutUser(userId);
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const userId = (currentPassword as { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!currentPassword || !newPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    return await this.authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }
}
