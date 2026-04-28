import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly ses: SESClient;

  private loadTemplate(
    name: string,
    variables: Record<string, string>,
  ): string {
    const filePath = path.join(__dirname, '../../../templates', `${name}.html`);
    let html = fs.readFileSync(filePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`\${${key}}`, value);
    }

    return html;
  }

  constructor(private readonly config: ConfigService) {
    this.ses = new SESClient({
      region: config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendWelcomeVerificationEmail(to: string, name: string, token: string) {
    const from = this.config.getOrThrow<string>('MAIL_FROM');
    const verificationUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/auth/verify?token=${token}`;

    const html = this.loadTemplate('verification', {
      name,
      verification_url: verificationUrl,
    });

    await this.ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: '[Important] - Email Verification' },
          Body: {
            Html: {
              Data: html,
            },
          },
        },
      }),
    );
  }

  async sendPasswordReset(to: string, name: string, token: string) {
    const from = this.config.getOrThrow<string>('MAIL_FROM');
    const resetUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/auth/reset-password?token=${token}`;

    const html = this.loadTemplate('forget-password', {
      name,
      reset_url: resetUrl,
    });

    await this.ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: '[Important] - Password Reset Request' },
          Body: {
            Html: {
              Data: html,
            },
          },
        },
      }),
    );
  }
}
