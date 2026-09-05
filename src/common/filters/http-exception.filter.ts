import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '../exceptions/api-error.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorStack: string | undefined = undefined;

    if (exception instanceof ApiError) {
      statusCode = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>)
              .message as string) || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorStack = exception.stack;
    }

    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    const responseBody: Record<string, unknown> = {
      status: statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'fail',
      message,
    };

    if (isDevelopment && errorStack) {
      responseBody.stack = errorStack;
    }

    response.status(statusCode).json(responseBody);
  }
}
