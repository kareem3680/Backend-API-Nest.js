import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { Request as CustomRequest } from '../interfaces/request.interface';
import { LoggerService } from '../utils/logger.util';
import { shortenUserAgent } from '../utils/user-agent.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<CustomRequest>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const clientInfo = shortenUserAgent(request.get('user-agent'));
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const userId = user?._id || 'unauthenticated';
          this.logger.info(
            `${method} ${url} ${response.statusCode} ${duration}ms - ${ip} ${clientInfo} ${userId}`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const status = (error as { status?: number }).status || 500;
          this.logger.error(
            `${method} ${url} ${status} ${duration}ms - ${ip} ${clientInfo} - ${error.message}`,
          );
        },
      }),
    );
  }
}
