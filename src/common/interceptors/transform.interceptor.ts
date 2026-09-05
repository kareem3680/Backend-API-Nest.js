import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface StandardResponse {
  status?: string;
  message?: string;
  data?: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data && typeof data === 'object' && 'status' in data) {
          return data;
        }

        const responseData = data as StandardResponse;

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          return {
            status: 'success',
            message: responseData.message,
            data: responseData.data,
          };
        }

        return {
          status: 'success',
          data,
        };
      }),
    );
  }
}
