import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  allowedOrigins: string;
  throttleTtl: number;
  throttleLimit: number;
}

export const appConfig = (configService: ConfigService): AppConfig => ({
  nodeEnv: configService.get<string>('NODE_ENV', 'development'),
  port: configService.get<number>('PORT', 8000),
  allowedOrigins: configService.get<string>('ALLOWED_ORIGINS', '*'),
  throttleTtl: configService.get<number>('THROTTLE_TTL', 60000),
  throttleLimit: configService.get<number>('THROTTLE_LIMIT', 100),
});

export default registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
    throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  }),
);
