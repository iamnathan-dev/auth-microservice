import { PrismaService } from 'src/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthUtils {
  private readonly REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  sanitizeUser<
    T extends {
      password?: unknown;
      refreshTokenExpiry?: unknown;
      resetPasswordToken?: unknown;
      resetPasswordTokenExpiry?: unknown;
      emailVerificationToken?: unknown;
      emailVerificationTokenExpiry?: unknown;
    },
  >(user: T) {
    const {
      password,
      refreshTokenExpiry,
      resetPasswordToken,
      resetPasswordTokenExpiry,
      emailVerificationToken,
      emailVerificationTokenExpiry,
      ...safeUser
    } = user;
    return safeUser;
  }

  generateAccessToken(userId: string) {
    const ACCESS_TOKEN_SECRET = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );

    if (!ACCESS_TOKEN_SECRET) {
      throw new Error(
        'ACCESS_TOKEN_SECRET is not defined in environment variables',
      );
    }

    return this.jwtService.sign(
      { userId },
      { secret: ACCESS_TOKEN_SECRET, expiresIn: '1h' },
    );
  }

  generateRefreshToken(userId: string) {
    const REFRESH_TOKEN_SECRET = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    if (!REFRESH_TOKEN_SECRET) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }

    return this.jwtService.sign(
      { userId },
      { secret: REFRESH_TOKEN_SECRET, expiresIn: '7d' },
    );
  }

  async issueTokens(userId: string) {
    const access_token = this.generateAccessToken(userId);
    const refresh_token = this.generateRefreshToken(userId);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refresh_token,
        expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL_MS),
        user: { connect: { id: userId } },
      },
    });

    return { access_token, refresh_token };
  }

  generateEmailVerificationToken(userId: string) {
    const EMAIL_VERIFICATION_TOKEN_SECRET = this.configService.get<string>(
      'EMAIL_VERIFICATION_TOKEN_SECRET',
    );

    if (!EMAIL_VERIFICATION_TOKEN_SECRET) {
      throw new Error(
        'EMAIL_VERIFICATION_TOKEN_SECRET is not defined in environment variables',
      );
    }

    return this.jwtService.sign(
      { userId },
      { secret: EMAIL_VERIFICATION_TOKEN_SECRET, expiresIn: '1d' },
    );
  }

  generatePasswordResetToken(email: string) {
    const PASSWORD_RESET_TOKEN_SECRET = this.configService.get<string>(
      'PASSWORD_RESET_TOKEN_SECRET',
    );

    if (!PASSWORD_RESET_TOKEN_SECRET) {
      throw new Error(
        'PASSWORD_RESET_TOKEN_SECRET is not defined in environment variables',
      );
    }

    return this.jwtService.sign(
      { email },
      { secret: PASSWORD_RESET_TOKEN_SECRET, expiresIn: '1h' },
    );
  }

  verifyEmailVerificationToken(token: string) {
    const EMAIL_VERIFICATION_TOKEN_SECRET = this.configService.get<string>(
      'EMAIL_VERIFICATION_TOKEN_SECRET',
    );

    if (!EMAIL_VERIFICATION_TOKEN_SECRET) {
      throw new Error(
        'EMAIL_VERIFICATION_TOKEN_SECRET is not defined in environment variables',
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: EMAIL_VERIFICATION_TOKEN_SECRET,
      });
      return (payload as { userId: string }).userId;
    } catch (err) {
      throw new Error('Invalid or expired email verification token');
    }
  }

  verifyRefreshToken(token: string) {
    const REFRESH_TOKEN_SECRET = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    if (!REFRESH_TOKEN_SECRET) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: REFRESH_TOKEN_SECRET,
      });
      return (payload as { userId: string }).userId;
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
