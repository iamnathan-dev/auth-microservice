import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from 'src/services/profiles/profiles.service';
import { JwtAuthGuard } from '../auth/jw-auth.guard';

@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfilesService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    return await this.profileService.getUserProfile(userId as string);
  }
}
