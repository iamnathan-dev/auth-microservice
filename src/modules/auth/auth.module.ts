import { MAILER_OPTIONS, MailerService } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthService } from 'src/services/auth/auth.service';
import { EmailService } from 'src/services/email/email.service';
import { HashService } from 'src/services/hash/hash.service';
import { AuthUtils } from 'src/utils/auth';
import { MailModule } from '../mail/mail.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService, HashService, AuthUtils, EmailService, JwtService],
})
export class AuthModule {}
