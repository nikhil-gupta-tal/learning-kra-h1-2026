import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IsPublic } from '@/common/decorators/is-public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { AuthenticatedRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @IsPublic()
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.authService.setAuthCookies(response, result.tokens);
    return { user: result.user };
  }

  @Post('login')
  @IsPublic()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.authService.setAuthCookies(response, result.tokens);
    return { user: result.user };
  }

  @Post('refresh')
  @IsPublic()
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      request.cookies?.refresh_token as string,
    );
    this.authService.setAuthCookies(response, result.tokens);
    return { user: result.user };
  }

  @Post('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.auth.sid);
    this.authService.clearAuthCookies(response);
    return { message: 'Logged out' };
  }

  @Post('logout-all')
  async logoutAll(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(request.auth.sub);
    this.authService.clearAuthCookies(response);
    return { message: 'Logged out from all sessions' };
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.auth.sub);
  }

  @Get('sessions')
  sessions(@Req() request: AuthenticatedRequest) {
    return this.authService.sessions(request.auth.sub, request.auth.sid);
  }
}
