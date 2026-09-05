import { Expose } from 'class-transformer';

export class ResponseDto<T> {
  @Expose()
  status!: 'success' | 'error';

  @Expose()
  message?: string;

  @Expose()
  data?: T;

  @Expose()
  errors?: unknown[];
}
