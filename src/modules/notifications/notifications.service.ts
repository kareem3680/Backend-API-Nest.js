import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationCache } from './cache/notification.cache';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { SocketGateway } from '../../shared/socket/socket.gateway';
import { FcmService } from '../../shared/fcm/fcm.service';
import { LoggerService } from '../../common/utils/logger.util';
import { UsersRepository } from '../identity/users/repository/users.repository';
import { SOCKET_EVENTS } from '../../shared/socket/constants/socket.constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new LoggerService('notifications');

  constructor(
    private notificationsRepository: NotificationsRepository,
    private usersRepository: UsersRepository,
    private socketGateway: SocketGateway,
    private fcmService: FcmService,
    private notificationCache: NotificationCache,
  ) {}

  async createNotification(
    createDto: CreateNotificationDto,
    userId: string,
    companyId: string | null,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.create({
      ...createDto,
      fromUserId: userId,
      companyId,
    });

    await this.notificationCache.invalidateAll(userId);

    this.logger.info('Notification created', { id: notification.id });

    return plainToInstance(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  async createAndSendNotification(
    createDto: CreateNotificationDto,
    userId: string,
    companyId: string | null,
  ): Promise<NotificationResponseDto> {
    const { toUser, toRole, title, message } = createDto;

    const notification = await this.notificationsRepository.create({
      ...createDto,
      fromUserId: userId,
      companyId,
    });

    const notificationDto = plainToInstance(
      NotificationResponseDto,
      notification,
      {
        excludeExtraneousValues: true,
      },
    );

    const socketSentUsers = new Set<string>();
    const fcmTokensToClean: Map<string, string> = new Map();

    if (toUser && toUser.length > 0) {
      const users = await this.usersRepository.findUsersByIds(
        toUser,
        companyId,
      );

      for (const user of users) {
        this.socketGateway.emitToUser(
          user.id,
          SOCKET_EVENTS.NEW_NOTIFICATION,
          notificationDto,
        );
        socketSentUsers.add(user.id);

        if (user.fcmTokens && user.fcmTokens.length > 0) {
          for (const token of user.fcmTokens) {
            fcmTokensToClean.set(token, user.id);
          }
        }
      }
    }

    if (toRole && toRole.length > 0 && companyId) {
      const users = await this.usersRepository.findUsersByRoles(
        toRole,
        companyId,
      );

      for (const user of users) {
        if (!socketSentUsers.has(user.id)) {
          this.socketGateway.emitToUser(
            user.id,
            SOCKET_EVENTS.NEW_NOTIFICATION,
            notificationDto,
          );
          socketSentUsers.add(user.id);
        }

        if (user.fcmTokens && user.fcmTokens.length > 0) {
          for (const token of user.fcmTokens) {
            if (!fcmTokensToClean.has(token)) {
              fcmTokensToClean.set(token, user.id);
            }
          }
        }
      }
    }

    const invalidTokens: Map<string, string> = new Map();

    if (fcmTokensToClean.size > 0 && this.fcmService.isInitialized()) {
      const tokens = Array.from(fcmTokensToClean.keys());
      const result = await this.fcmService.sendFCMBatch(
        tokens,
        title,
        message,
        {
          notificationId: notification.id,
          module: notification.module,
          importance: notification.importance,
        },
      );

      for (const failedToken of result.failedTokens) {
        const failedUserId = fcmTokensToClean.get(failedToken);
        if (failedUserId) {
          invalidTokens.set(failedToken, failedUserId);
        }
      }
    }

    if (invalidTokens.size > 0) {
      const tokensByUser = new Map<string, string[]>();
      for (const [token, uid] of invalidTokens) {
        if (!tokensByUser.has(uid)) {
          tokensByUser.set(uid, []);
        }
        tokensByUser.get(uid)!.push(token);
      }

      for (const [uid, tokens] of tokensByUser) {
        const user = await this.usersRepository.findOne(uid);
        if (user) {
          const newTokens = user.fcmTokens.filter((t) => !tokens.includes(t));
          await this.usersRepository.update(uid, { fcmTokens: newTokens });
        }
      }
    }

    await this.notificationCache.invalidateAll(userId);

    this.logger.info('Notification created and sent', {
      id: notification.id,
      socketSent: socketSentUsers.size,
      fcmSuccess: fcmTokensToClean.size - invalidTokens.size,
      fcmFailed: invalidTokens.size,
    });

    return notificationDto;
  }

  async getUserNotifications(
    userId: string,
    userRole: string,
    companyId: string | null,
    paginationDto: PaginationDto,
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const plainPagination = {
      page: paginationDto.page,
      limit: paginationDto.limit,
      sort: paginationDto.sort,
      fields: paginationDto.fields,
      keyword: paginationDto.keyword,
      searchFields: paginationDto.searchFields,
      from: paginationDto.from,
      to: paginationDto.to,
      populate: paginationDto.populate,
    };

    const combinedQuery = { ...plainPagination, ...query };

    const cached = await this.notificationCache.getUserNotifications(
      userId,
      combinedQuery,
    );
    if (cached) {
      return cached;
    }

    const result = await this.notificationsRepository.findUserNotifications(
      combinedQuery,
      userId,
      userRole,
      companyId,
    );

    await this.notificationCache.setUserNotifications(
      userId,
      combinedQuery,
      result,
      300,
    );

    this.logger.info('Fetched user notifications', { userId });

    return result;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cached = await this.notificationCache.getUnreadCount(userId);
    if (cached !== null) {
      return cached;
    }

    const count = await this.notificationsRepository.countUnread(userId);

    await this.notificationCache.setUnreadCount(userId, count, 60);

    return count;
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.markAsRead(
      notificationId,
      userId,
    );

    if (!notification) {
      throw new NotFoundException(
        "Notification not found or you don't have permission",
      );
    }

    await this.notificationCache.invalidateAll(userId);

    this.socketGateway.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ, {
      notificationId,
    });

    this.logger.info('Notification marked as read', { notificationId, userId });

    return plainToInstance(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationsRepository.markAllAsRead(userId);

    await this.notificationCache.invalidateAll(userId);

    this.socketGateway.emitToUser(userId, SOCKET_EVENTS.NOTIFICATIONS_READ, {
      all: true,
    });

    this.logger.info('All notifications marked as read', {
      userId,
      modifiedCount: result.modifiedCount,
    });

    return result;
  }
}
