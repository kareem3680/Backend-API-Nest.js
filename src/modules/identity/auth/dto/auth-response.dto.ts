import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @Expose()
  user!: UserResponseDto;

  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
