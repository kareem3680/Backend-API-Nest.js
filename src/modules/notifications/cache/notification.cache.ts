import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../shared/cache/cache.service';
import { LoggerService } from '../../../common/utils/logger.util';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@Injectable()
export class NotificationCache {
  private readonly logger = new LoggerService('notification-cache');

  constructor(private cacheService: CacheService) {}

  private buildUserNotificationsKey(
    userId: string,
    query: Record<string, unknown>,
  ): string {
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce(
        (obj, key) => {
          obj[key] = query[key];
          return obj;
        },
        {} as Record<string, unknown>,
      );

    return `notifications:user:${userId}:${JSON.stringify(sortedQuery)}`;
  }

  private buildUnreadCountKey(userId: string): string {
    return `notifications:unread:${userId}`;
  }

  async getUserNotifications(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<PaginatedResponseDto<NotificationResponseDto> | null> {
    const cacheKey = this.buildUserNotificationsKey(userId, query);
    const cached =
      await this.cacheService.get<
        PaginatedResponseDto<NotificationResponseDto>
      >(cacheKey);

    if (cached) {
      this.logger.debug('Cache HIT for user notifications', { userId });
      return cached;
    }

    this.logger.debug('Cache MISS for user notifications', { userId });
    return null;
  }

  async setUserNotifications(
    userId: string,
    query: Record<string, unknown>,
    value: PaginatedResponseDto<NotificationResponseDto>,
    ttl: number = 300,
  ): Promise<void> {
    const cacheKey = this.buildUserNotificationsKey(userId, query);
    await this.cacheService.set(cacheKey, value, ttl);
    this.logger.debug('Cache SET for user notifications', { userId, ttl });
  }

  async getUnreadCount(userId: string): Promise<number | null> {
    const cacheKey = this.buildUnreadCountKey(userId);
    const cached = await this.cacheService.get<number>(cacheKey);

    if (cached !== null) {
      this.logger.debug('Cache HIT for unread count', { userId });
      return cached;
    }

    this.logger.debug('Cache MISS for unread count', { userId });
    return null;
  }

  async setUnreadCount(
    userId: string,
    count: number,
    ttl: number = 60,
  ): Promise<void> {
    const cacheKey = this.buildUnreadCountKey(userId);
    await this.cacheService.set(cacheKey, count, ttl);
    this.logger.debug('Cache SET for unread count', { userId, ttl });
  }

  async invalidateUserNotifications(userId: string): Promise<void> {
    await this.cacheService.del(`notifications:user:${userId}:*`);
    this.logger.debug('Invalidated user notifications cache', { userId });
  }

  async invalidateUnreadCount(userId: string): Promise<void> {
    await this.cacheService.del(this.buildUnreadCountKey(userId));
    this.logger.debug('Invalidated unread count cache', { userId });
  }

  async invalidateAll(userId: string): Promise<void> {
    await this.invalidateUnreadCount(userId);
    await this.invalidateUserNotifications(userId);
    this.logger.debug('Invalidated all cache for user', { userId });
  }
}
