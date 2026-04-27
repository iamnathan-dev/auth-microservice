import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async verifyHashedPassword(passwordHash: string, password: string) {
    return await argon2.verify(passwordHash, password);
  }
}
