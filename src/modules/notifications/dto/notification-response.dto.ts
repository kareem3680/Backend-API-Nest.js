import { Expose, Transform } from 'class-transformer';
import { Notification } from '../entities/notification.entity';

export class NotificationResponseDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.refId)
  refId!: string | null;

  @Expose()
  message!: string;

  @Expose()
  module!: string;

  @Expose()
  importance!: string;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.fromUserId)
  fromUserId!: string | null;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.toRole)
  toRole!: string[];

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.toUser)
  toUser!: string[];

  @Expose()
  status!: string;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.companyId)
  companyId!: string | null;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.createdAt)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: Notification }) => obj.updatedAt)
  updatedAt!: Date;
}
