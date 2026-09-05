import { Expose, Transform } from 'class-transformer';
import { User } from '../../entities/user.entity';

export class ProfileResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  email?: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.profileImage)
  profileImage?: string;

  @Expose()
  active!: boolean;

  @Expose()
  phone?: string;

  @Expose()
  role!: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.hireDate)
  hireDate!: Date;

  @Expose()
  position?: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.jobId)
  jobId?: number;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.createdAt)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.updatedAt)
  updatedAt!: Date;
}
