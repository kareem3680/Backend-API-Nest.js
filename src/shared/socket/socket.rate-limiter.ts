import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { socketConfig } from '../../config/socket.config';
import { LoggerService } from '../../common/utils/logger.util';

interface RateLimitEntry {
  timestamps: number[];
}

@Injectable()
export class SocketRateLimiter {
  private readonly logger = new LoggerService(SocketRateLimiter.name);
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly ttlMs: number;
  private readonly cleanupIntervalMs: number;
  private readonly socketRequests: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    const config = socketConfig(this.configService);
    this.windowMs = config.rateLimitWindowMs;
    this.maxRequests = config.rateLimitMaxCount;
    this.ttlMs = config.rateLimiterTtlMs;
    this.cleanupIntervalMs = config.rateLimiterCleanupMs;
    this.socketRequests = new Map();
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  canSendRequest(userId: string, socketId: string): boolean {
    const key = `${userId}:${socketId}`;
    const now = Date.now();

    let entry = this.socketRequests.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.socketRequests.set(key, entry);
    }

    const recentTimestamps = entry.timestamps.filter(
      (time) => now - time < this.windowMs,
    );

    if (recentTimestamps.length >= this.maxRequests) {
      return false;
    }

    recentTimestamps.push(now);
    entry.timestamps = recentTimestamps;
    this.socketRequests.set(key, entry);

    return true;
  }

  clearSocket(userId: string, socketId: string): void {
    const key = `${userId}:${socketId}`;
    this.socketRequests.delete(key);
  }

  clearUser(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.socketRequests.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.socketRequests.delete(key));
    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Cleared ${keysToDelete.length} rate limit entries for user ${userId}`,
      );
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.socketRequests.entries()) {
      const validTimestamps = entry.timestamps.filter(
        (time) => now - time < this.ttlMs,
      );
      if (validTimestamps.length === 0) {
        this.socketRequests.delete(key);
        cleaned++;
      } else {
        entry.timestamps = validTimestamps;
        this.socketRequests.set(key, entry);
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Rate limiter cleaned ${cleaned} old entries`);
    }
  }

  getStats(): { totalTrackedSockets: number } {
    return {
      totalTrackedSockets: this.socketRequests.size,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.socketRequests.clear();
    this.logger.info('Socket rate limiter destroyed');
  }
}
