import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/is-public.decorator';
import { AuthenticatedRequest, JwtPayload } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.access_token as string | undefined;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException();
      }

      (request as AuthenticatedRequest).auth = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
