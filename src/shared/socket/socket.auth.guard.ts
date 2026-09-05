import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../modules/identity/users/repository/users.repository';
import { isGlobalRole } from '../../common/constants';
import { SOCKET_ERROR_MESSAGES } from './constants/socket.constants';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  AuthenticatedSocket,
  ExtendedHandshake,
} from './interfaces/socket.interface';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      const user = await this.usersRepository.findOne(payload.userId);
      if (!user) {
        throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      if (!user.active) {
        throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      if (!isGlobalRole(user.role) && !user.companyId) {
        throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      client.user = {
        _id: user.id,
        role: user.role,
        companyId: user.companyId,
        name: user.name,
        active: user.active,
      };

      return true;
    } catch {
      throw new UnauthorizedException(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const handshake = client.handshake as ExtendedHandshake;
    const authToken = handshake.auth?.token ?? handshake.headers?.authorization;

    if (!authToken) {
      return null;
    }

    if (authToken.startsWith('Bearer ')) {
      return authToken.slice(7);
    }

    return authToken;
  }
}
