import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  password: string;
}
