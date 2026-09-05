import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
} from 'class-validator';
import { USER_ROLES, UserRole } from '../../../../common/constants';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsEmail()
  email!: string;

  @IsIn(USER_ROLES.filter((r) => r !== 'super-admin'))
  role!: Exclude<UserRole, 'super-admin'>;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(5)
  @Matches(/(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;

  @IsString()
  passwordConfirmation!: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  companyId?: string;
}
