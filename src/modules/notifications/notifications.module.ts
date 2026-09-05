import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationCache } from './cache/notification.cache';
import { Notification } from './entities/notification.entity';
import { UsersRepository } from '../identity/users/repository/users.repository';
import { User } from '../identity/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationCache,
    UsersRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
