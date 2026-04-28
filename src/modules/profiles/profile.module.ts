import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileController } from 'src/controllers/profile/profile.controller';
import { ProfilesService } from 'src/services/profiles/profiles.service';
import { AuthUtils } from 'src/utils/auth';

@Module({
  controllers: [ProfileController],
  providers: [ProfilesService, AuthUtils, JwtService],
})
export class ProfileModule {}
