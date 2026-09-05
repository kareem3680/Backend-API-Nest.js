import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from '../interfaces/request.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof NonNullable<Request['user']> | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
