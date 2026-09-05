import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export const jwtConfig = (configService: ConfigService): JwtConfig => ({
  secret: configService.get<string>('JWT_SECRET', 'default-secret-change-me'),
  accessExpiresIn: configService.get<string>('JWT_ACCESS_EXPIRE', '15m'),
  refreshExpiresIn: configService.get<string>('JWT_REFRESH_EXPIRE', '30d'),
});

export default registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  }),
);
