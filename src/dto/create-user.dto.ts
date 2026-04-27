import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/, {
    message:
      'Password must be at least 8 characters, include uppercase, lowercase, a number, and a symbol',
  })
  password!: string;

  @IsString()
  name!: string;
}
