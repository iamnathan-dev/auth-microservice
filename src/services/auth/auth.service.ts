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

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // send welcome email
    await this.mailService.sendWelcomeVerificationEmail(email, name);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'User account created successfully',
      data: this.authUtils.sanitizeUser(user),
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

    const { access_token, refresh_token } = await this.authUtils.issueTokens(
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User logined in successfully',
      access_token,
      refresh_token,
      data: this.authUtils.sanitizeUser(user),
    };
  }
}
