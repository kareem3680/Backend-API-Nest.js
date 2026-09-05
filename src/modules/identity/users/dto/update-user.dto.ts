import { IsOptional, IsString, IsIn } from 'class-validator';
import { USER_ROLES, UserRole } from '../../../../common/constants';

export class UpdateUserDto {
  @IsOptional()
  @IsIn(USER_ROLES.filter((r) => r !== 'super-admin'))
  role?: Exclude<UserRole, 'super-admin'>;

  @IsOptional()
  @IsString()
  position?: string;
}
