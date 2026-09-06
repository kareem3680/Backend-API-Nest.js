import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '../exceptions/api-error.exception';
import { LoggerService } from '../../common/utils/logger.util';
import { shortenUserAgent } from '../../common/utils/user-agent.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorStack: string | undefined;

    if (exception instanceof ApiError) {
      statusCode = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const nestedMessage = (exceptionResponse as Record<string, unknown>)
          .message;
        message = Array.isArray(nestedMessage)
          ? nestedMessage.join(', ')
          : String(nestedMessage);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorStack = exception.stack;
    }

    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    const clientInfo = shortenUserAgent(request.get('user-agent'));
    const logMessage = `${request.method} ${request.url} ${statusCode} - ${message} - ${request.ip} ${clientInfo}`;
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, { stack: errorStack });
    } else {
      this.logger.warn(logMessage);
    }

    const responseBody: Record<string, unknown> = {
      status: statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'fail',
      message:
        statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && !isDevelopment
          ? 'Internal server error'
          : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (isDevelopment && errorStack) {
      responseBody.stack = errorStack;
    }

    response.status(statusCode).json(responseBody);
  }
}
