import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeVerificationEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Welcome to Our App!',
      html: `<h1>Hello, ${name}!</h1><p>Thanks for signing up.</p>`,
    });
  }

  async sendPasswordReset(to: string, token: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Password Reset Request',
      html: `<p>Use this token to reset your password: <b>${token}</b></p>`,
    });
  }
}
