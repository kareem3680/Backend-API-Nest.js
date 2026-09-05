import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { Request as CustomRequest } from '../interfaces/request.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<CustomRequest>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const userId = user?._id || 'unauthenticated';
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${duration}ms - ${userAgent} ${ip} ${userId}`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const status = (error as { status?: number }).status || 500;
          this.logger.error(
            `${method} ${url} ${status} ${duration}ms - ${userAgent} ${ip} - ${error.message}`,
          );
        },
      }),
    );
  }
}
