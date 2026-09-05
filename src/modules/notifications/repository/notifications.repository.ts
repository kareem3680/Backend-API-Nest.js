import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { BaseRepository } from '../../../shared/database/base.repository';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@Injectable()
export class NotificationsRepository extends BaseRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
  ) {
    super(repository);
  }

  async findUserNotifications(
    query: Record<string, unknown>,
    userId: string,
    userRole: string,
    companyId: string | null,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const queryBuilder = this.createQueryBuilder('notification');

    queryBuilder.andWhere(
      '(notification.toUser @> :userId::jsonb OR (notification.toRole @> :userRole::jsonb AND notification.companyId = :companyId))',
      {
        userId: JSON.stringify([userId]),
        userRole: JSON.stringify([userRole]),
        companyId,
      },
    );

    return this.paginateWithFiltersAndDto(
      queryBuilder,
      query,
      NotificationResponseDto,
      ['notification.title', 'notification.message'],
    );
  }

  async findByToUser(userId: string): Promise<Notification[]> {
    return this.repository
      .createQueryBuilder('notification')
      .where('notification.toUser @> :userId::jsonb', {
        userId: JSON.stringify([userId]),
      })
      .orderBy('notification.createdAt', 'DESC')
      .getMany();
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    const notification = await this.repository
      .createQueryBuilder('notification')
      .where('notification.id = :id', { id: notificationId })
      .andWhere('notification.toUser @> :userId::jsonb', {
        userId: JSON.stringify([userId]),
      })
      .getOne();

    if (!notification) {
      return null;
    }

    notification.status = 'read';
    return this.repository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: 'read' })
      .where('toUser @> :userId::jsonb', {
        userId: JSON.stringify([userId]),
      })
      .andWhere('status = :status', { status: 'unread' })
      .execute();

    return { modifiedCount: result.affected ?? 0 };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('notification')
      .where('notification.toUser @> :userId::jsonb', {
        userId: JSON.stringify([userId]),
      })
      .andWhere('notification.status = :status', { status: 'unread' })
      .getCount();
  }
}
