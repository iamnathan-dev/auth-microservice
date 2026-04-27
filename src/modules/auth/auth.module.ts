import { Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthService } from 'src/services/auth/auth.service';
import { HashService } from 'src/services/hash/hash.service';
import { AuthUtils } from 'src/utils/auth';

@Module({
  controllers: [AuthController],
  providers: [AuthService, HashService, AuthUtils],
})
export class AuthModule {}
