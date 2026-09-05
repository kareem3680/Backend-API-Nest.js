import { Injectable, Logger } from '@nestjs/common';
import { Request } from '../../common/interfaces/request.interface';
import { isGlobalRole } from '../../common/constants';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  getCompanyIdFromRequest(request: Request): string | null {
    const user = request.user;

    if (!user) {
      return null;
    }

    if (isGlobalRole(user.role)) {
      return null;
    }

    if (!user.companyId) {
      this.logger.warn(`User ${user._id} has no company context`);
      return null;
    }

    return user.companyId;
  }

  extractCompanyIdFromBody(
    body: Record<string, unknown>,
    role: string,
  ): string | null {
    if (isGlobalRole(role)) {
      return (body.companyId as string) || null;
    }
    return null;
  }

  shouldEnforceCompanyContext(role: string): boolean {
    if (isGlobalRole(role)) {
      return false;
    }
    return true;
  }
}
