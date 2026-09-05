import { Expose, Transform } from 'class-transformer';
import { User } from '../../entities/user.entity';

export class JwtUserResponseDto {
  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.id)
  _id!: string;

  @Expose()
  name!: string;

  @Expose()
  email?: string;

  @Expose()
  role!: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.companyId)
  companyId?: string | null;

  @Expose()
  active!: boolean;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.profileImage)
  profileImage?: string;

  @Expose()
  phone?: string;

  @Expose()
  position?: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.jobId)
  jobId?: number;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.hireDate)
  hireDate!: Date;
}
