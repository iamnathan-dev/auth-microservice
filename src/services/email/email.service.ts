import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly ses: SESClient;

  constructor(private readonly config: ConfigService) {
    this.ses = new SESClient({
      region: config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendWelcomeVerificationEmail(to: string, name: string) {
    const from = this.config.getOrThrow<string>('MAIL_FROM');

    await this.ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: 'Welcome to Our App!' },
          Body: {
            Html: {
              Data: `<h1>Hello, ${name}!</h1><p>Thanks for signing up.</p>`,
            },
          },
        },
      }),
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const from = this.config.getOrThrow<string>('MAIL_FROM');

    await this.ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: 'Password Reset Request' },
          Body: {
            Html: {
              Data: `<p>Use this token to reset your password: <b>${token}</b></p>`,
            },
          },
        },
      }),
    );
  }
}
