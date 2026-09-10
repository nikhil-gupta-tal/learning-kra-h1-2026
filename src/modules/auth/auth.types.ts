import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  sid: number;
  tokenType: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  auth: JwtPayload;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
