import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SocketRateLimiter } from './socket.rate-limiter';
import { getUserRoom, getRoleRoom } from './helpers/socket.room-helper';
import { emitSocketError } from './helpers/socket.error-handler';
import {
  SOCKET_EVENTS,
  SOCKET_ERROR_MESSAGES,
} from './constants/socket.constants';
import { isGlobalRole } from '../../common/constants';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../../modules/identity/users/repository/users.repository';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import type { AuthenticatedSocket } from './interfaces/socket.interface';
import { LoggerService } from '../../common/utils/logger.util';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private rateLimiter: SocketRateLimiter;
  private readonly logger = new LoggerService(SocketGateway.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => UsersRepository))
    private usersRepository: UsersRepository,
  ) {
    this.rateLimiter = new SocketRateLimiter(this.configService);
  }

  afterInit(): void {
    this.logger.info('Socket Gateway initialized');
    this.server.use((socket: AuthenticatedSocket, next) => {
      this.handleAuth(socket)
        .then(() => next())
        .catch((err: Error) => next(err));
    });
  }

  private async handleAuth(socket: AuthenticatedSocket): Promise<void> {
    const token = this.extractToken(socket);

    if (!token) {
      throw new Error(SOCKET_ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      const user = await this.usersRepository.findOne(payload.userId);

      if (!user || !user.active) {
        throw new Error(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      if (!isGlobalRole(user.role) && !user.companyId) {
        throw new Error(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
      }

      socket.user = {
        _id: user.id,
        role: user.role,
        companyId: user.companyId,
        name: user.name,
        active: user.active,
      };
    } catch {
      throw new Error(SOCKET_ERROR_MESSAGES.AUTH_FAILED);
    }
  }

  private extractToken(socket: AuthenticatedSocket): string | null {
    const handshake = socket.handshake as {
      auth?: { token?: string };
      headers?: { authorization?: string };
    };
    const authToken = handshake.auth?.token ?? handshake.headers?.authorization;

    if (!authToken) {
      return null;
    }

    if (typeof authToken === 'string' && authToken.startsWith('Bearer ')) {
      return authToken.slice(7);
    }

    if (typeof authToken === 'string') {
      return authToken;
    }

    return null;
  }

  handleConnection(client: AuthenticatedSocket): void {
    const user = client.user;
    if (!user) {
      this.logger.warn(
        `Connection rejected: No user data, Socket: ${client.id}`,
      );
      client.disconnect();
      return;
    }

    this.logger.info(
      `Client connected: ${client.id}, User: ${user._id}, Company: ${user.companyId || 'none'}, Role: ${user.role}`,
    );

    const isGlobal = isGlobalRole(user.role);
    if (!isGlobal && !user.companyId) {
      this.logger.warn(
        `Connection rejected: No companyId for non-global user, User: ${user._id}, Role: ${user.role}`,
      );
      emitSocketError(client, SOCKET_ERROR_MESSAGES.AUTH_FAILED, 401);
      client.disconnect();
      return;
    }

    const userRoom = getUserRoom(user._id);
    void client.join(userRoom);
    this.logger.debug(`User ${user._id} joined room: ${userRoom}`);

    if (user.role && user.companyId) {
      const roleRoom = getRoleRoom(user.role, user.companyId);
      void client.join(roleRoom);
      this.logger.debug(`User ${user._id} joined role room: ${roleRoom}`);
    }

    this.logger.info(
      `Client connected successfully: ${client.id}, User: ${user._id}`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const user = client.user;
    if (user) {
      this.logger.info(
        `Client disconnected: ${client.id}, User: ${user._id}, Company: ${user.companyId}, Role: ${user.role}`,
      );
      this.rateLimiter.clearSocket(user._id, client.id);
    } else {
      this.logger.info(`Client disconnected (unauthenticated): ${client.id}`);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.PING)
  handlePing(): {
    event: string;
    data: { message: string; timestamp: number };
  } {
    return {
      event: SOCKET_EVENTS.PONG,
      data: {
        message: 'pong',
        timestamp: Date.now(),
      },
    };
  }

  @SubscribeMessage(SOCKET_EVENTS.NOTIFICATION_READ)
  handleNotificationRead(@ConnectedSocket() client: AuthenticatedSocket): void {
    const user = client.user;
    if (!user) {
      emitSocketError(client, SOCKET_ERROR_MESSAGES.AUTH_FAILED, 401);
      return;
    }

    if (!this.rateLimiter.canSendRequest(user._id, client.id)) {
      emitSocketError(client, SOCKET_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, 429);
      return;
    }
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    const room = getUserRoom(userId);
    this.server.to(room).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    userIds.forEach((userId) => {
      const room = getUserRoom(userId);
      this.server.to(room).emit(event, payload);
    });
  }

  emitToRole(
    role: string,
    companyId: string,
    event: string,
    payload: unknown,
  ): void {
    const room = getRoleRoom(role, companyId);
    this.server.to(room).emit(event, payload);
  }

  emitToRoles(
    roles: string[],
    companyId: string,
    event: string,
    payload: unknown,
  ): void {
    roles.forEach((role) => {
      const room = getRoleRoom(role, companyId);
      this.server.to(room).emit(event, payload);
    });
  }

  emitToAll(event: string, payload: unknown): void {
    this.server.emit(event, payload);
  }

  getRateLimiterStats(): { totalTrackedSockets: number } {
    return this.rateLimiter.getStats();
  }

  clearUserRateLimit(userId: string): void {
    this.rateLimiter.clearUser(userId);
  }

  destroy(): void {
    this.rateLimiter.destroy();
  }
}
