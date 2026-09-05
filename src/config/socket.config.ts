import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export interface SocketConfig {
  pingTimeout: number;
  pingInterval: number;
  maxDisconnectionDuration: number;
  rateLimitWindowMs: number;
  rateLimitMaxCount: number;
  rateLimiterCleanupMs: number;
  rateLimiterTtlMs: number;
}

export const socketConfig = (configService: ConfigService): SocketConfig => ({
  pingTimeout: configService.get<number>('SOCKET_PING_TIMEOUT', 60000),
  pingInterval: configService.get<number>('SOCKET_PING_INTERVAL', 25000),
  maxDisconnectionDuration: configService.get<number>(
    'SOCKET_MAX_DISCONNECTION_DURATION',
    120000,
  ),
  rateLimitWindowMs: configService.get<number>(
    'SOCKET_RATE_LIMIT_WINDOW_MS',
    60000,
  ),
  rateLimitMaxCount: configService.get<number>(
    'SOCKET_RATE_LIMIT_MAX_COUNT',
    20,
  ),
  rateLimiterCleanupMs: configService.get<number>(
    'SOCKET_RATE_LIMITER_CLEANUP_MS',
    300000,
  ),
  rateLimiterTtlMs: configService.get<number>(
    'SOCKET_RATE_LIMITER_TTL_MS',
    600000,
  ),
});

export default registerAs(
  'socket',
  (): SocketConfig => ({
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
    maxDisconnectionDuration: parseInt(
      process.env.SOCKET_MAX_DISCONNECTION_DURATION || '120000',
      10,
    ),
    rateLimitWindowMs: parseInt(
      process.env.SOCKET_RATE_LIMIT_WINDOW_MS || '60000',
      10,
    ),
    rateLimitMaxCount: parseInt(
      process.env.SOCKET_RATE_LIMIT_MAX_COUNT || '20',
      10,
    ),
    rateLimiterCleanupMs: parseInt(
      process.env.SOCKET_RATE_LIMITER_CLEANUP_MS || '300000',
      10,
    ),
    rateLimiterTtlMs: parseInt(
      process.env.SOCKET_RATE_LIMITER_TTL_MS || '600000',
      10,
    ),
  }),
);
