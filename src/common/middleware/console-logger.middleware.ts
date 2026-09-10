import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ConsoleLoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = randomUUID();
    const startedAt = Date.now();

    response.setHeader('X-Request-Id', requestId);

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const message = `${new Date(startedAt).toISOString()} ${request.method} ${request.path} ${response.statusCode} ${duration}ms id=${requestId}`;

      if (response.statusCode >= 500) {
        console.error(message);
        return;
      }

      console.log(message);
    });

    next();
  }
}
