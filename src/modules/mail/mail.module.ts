import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from 'src/services/email/email.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class MailModule {}
