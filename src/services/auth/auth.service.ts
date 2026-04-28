import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashService } from '../hash/hash.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { LoginUserDto } from 'src/dto/login-user.dto';
import { AuthUtils } from 'src/utils/auth';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly authUtils: AuthUtils,
    private readonly mailService: EmailService,
  ) {}

  async createUser(data: CreateUserDto) {
    const { email, password, name } = data;

    // check for exisitng user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // hash user password
    const hashedPassword = await this.hashService.hashPassword(password);
    const emailVerificationToken =
      this.authUtils.generateEmailVerificationToken(email);

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationTokenExpiry: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ), // 24 hours
        name,
      },
    });

    // send welcome email
    await this.mailService.sendVerificationEmail(
      email,
      name,
      emailVerificationToken,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message:
        'User account created successfully, please check your email to verify your account',
    };
  }

  async loginUser(data: LoginUserDto) {
    const { email, password } = data;

    // find user
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // validate password
    const isPasswordValid = await this.hashService.verifyHashedPassword(
      user.password,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const { access_token, refresh_token } = await this.authUtils.issueTokens(
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User logged in successfully',
      access_token,
      refresh_token,
      data: this.authUtils.sanitizeUser(user),
    };
  }

  async logoutUser(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'User logged out successfully',
    };
  }

  async forgetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordResetToken = this.authUtils.generatePasswordResetToken(email);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: passwordResetToken,
        resetPasswordTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.mailService.sendPasswordReset(
      email,
      user.name,
      passwordResetToken,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset email sent successfully',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await this.hashService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message:
        'Password reset successfully, you can now login with your new password',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // verify token
    this.authUtils.verifyEmailVerificationToken(token);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully, you can now login to your account',
    };
  }

  async resendEmail(email: string, type: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (type === 'verification') {
      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      const emailVerificationToken =
        this.authUtils.generateEmailVerificationToken(email);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken,
          emailVerificationTokenExpiry: new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ), // 24 hours
        },
      });

      await this.mailService.sendVerificationEmail(
        email,
        user.name,
        emailVerificationToken,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Verification email sent successfully',
      };
    }

    if (type === 'password-reset') {
      const passwordResetToken =
        this.authUtils.generateEmailVerificationToken(email);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: passwordResetToken,
          resetPasswordTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await this.mailService.sendPasswordReset(
        email,
        user.name,
        passwordResetToken,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Password reset email sent successfully',
      };
    }

    throw new BadRequestException('Invalid email resend type');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.hashService.verifyHashedPassword(
      user.password,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Invalid refresh token');
    }

    // verify token
    try {
      this.authUtils.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { access_token, refresh_token } = await this.authUtils.issueTokens(
      tokenRecord.userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      access_token,
      refresh_token,
    };
  }
}
