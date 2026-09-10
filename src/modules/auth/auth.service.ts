import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { toAuthSessionResponse } from '@/common/mappers/auth-session-response.mapper';
import {
  toUserDetailResponse,
  toUserResponse,
} from '@/common/mappers/user-response.mapper';
import { AuthSession } from '@/database/entities/auth-session.entity';
import { User } from '@/database/entities/user.entity';
import {
  ACCESS_TOKEN_TTL_MS,
  MAX_ACTIVE_SESSIONS,
  REFRESH_TOKEN_TTL_MS,
} from './constants/auth.constants';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthTokens, JwtPayload } from './auth.types';
import { hashValue, verifyValue } from './utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessionRepository: Repository<AuthSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userRepository.save({
      name: registerDto.name.trim(),
      email,
      passwordHash: await hashValue(registerDto.password),
    });

    return this.createLoginResult(user);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOneBy({ email });

    if (!user || !(await verifyValue(user.passwordHash, loginDto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createLoginResult(user);
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException();
    }

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sid, userId: payload.sub },
      relations: { user: true },
    });

    if (
      !session ||
      session.expiresAt <= new Date() ||
      !(await verifyValue(session.refreshTokenHash, refreshToken))
    ) {
      throw new UnauthorizedException();
    }

    const tokens = await this.issueTokens(session.user, session);
    session.lastUsedAt = new Date();
    session.refreshTokenHash = await hashValue(tokens.refreshToken);
    await this.sessionRepository.save(session);

    return { user: toUserResponse(session.user), tokens };
  }

  async logout(sessionId: number) {
    await this.sessionRepository.delete(sessionId);
  }

  async logoutAll(userId: number) {
    await this.sessionRepository.delete({ userId });
  }

  async me(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException();
    }

    return { user: toUserDetailResponse(user) };
  }

  async sessions(userId: number, currentSessionId: number) {
    const activeSessions = await this.sessionRepository.find({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    return {
      sessions: activeSessions.map((session) =>
        toAuthSessionResponse(session, currentSessionId),
      ),
    };
  }

  setAuthCookies(response: Response, tokens: AuthTokens) {
    const secure = this.configService.get('NODE_ENV') === 'production';
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_MS,
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/auth',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  clearAuthCookies(response: Response) {
    const secure = this.configService.get('NODE_ENV') === 'production';
    response.clearCookie('access_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/auth',
    });
  }

  private async createLoginResult(user: User) {
    await this.removeExpiredSessions(user.id);
    const activeSessions = await this.sessionRepository.find({
      where: { userId: user.id, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'ASC' },
    });

    if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
      await this.sessionRepository.delete(activeSessions[0].id);
    }

    const session = await this.sessionRepository.save({
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      lastUsedAt: new Date(),
      refreshTokenHash: '',
    });
    const tokens = await this.issueTokens(user, session);
    session.refreshTokenHash = await hashValue(tokens.refreshToken);
    await this.sessionRepository.save(session);

    return { user: toUserResponse(user), tokens };
  }

  private async issueTokens(
    user: User,
    session: AuthSession,
  ): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      sid: session.id,
      tokenType: 'access',
    };
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '1h' }),
      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }

  private async removeExpiredSessions(userId: number) {
    await this.sessionRepository.delete({
      userId,
      expiresAt: LessThanOrEqual(new Date()),
    });
  }
}
