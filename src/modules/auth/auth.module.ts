import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from '@/database/entities/auth-session.entity';
import { User } from '@/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthSession])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
