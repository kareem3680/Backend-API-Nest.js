import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  url: string;
  connectTimeout: number;
  defaultTtl: number;
  shortTtl: number;
  longTtl: number;
}

export const redisConfig = (configService: ConfigService): RedisConfig => ({
  url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
  connectTimeout: configService.get<number>('REDIS_CONNECT_TIMEOUT', 5000),
  defaultTtl: configService.get<number>('CACHE_TTL', 3600),
  shortTtl: configService.get<number>('CACHE_SHORT_TTL', 300),
  longTtl: configService.get<number>('CACHE_LONG_TTL', 86400),
});

export default registerAs(
  'redis',
  (): RedisConfig => ({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
    defaultTtl: parseInt(process.env.CACHE_TTL || '3600', 10),
    shortTtl: parseInt(process.env.CACHE_SHORT_TTL || '300', 10),
    longTtl: parseInt(process.env.CACHE_LONG_TTL || '86400', 10),
  }),
);
