import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isGlobalRole } from '../../../../common/constants';
import { Request } from '../../../../common/interfaces/request.interface';
import { COMPANY_CONTEXT_KEY } from '../../../../common/decorators/company-context.decorator';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const skipContext = this.reflector.getAllAndOverride<boolean>(
      COMPANY_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipContext === false) {
      request.companyId = null;
      return true;
    }

    const isGlobal = isGlobalRole(user.role);

    if (isGlobal) {
      request.companyId = null;
      return true;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    request.companyId = user.companyId;
    return true;
  }
}
