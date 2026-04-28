import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUtils } from 'src/utils/auth';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtils,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'User profile retrieved successfully',
      data: this.authUtils.sanitizeUser(user),
    };
  }
}
