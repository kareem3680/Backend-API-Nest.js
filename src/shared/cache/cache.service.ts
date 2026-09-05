import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { redisConfig } from '../../config/redis.config';
import { LoggerService } from '../../common/utils/logger.util';

@Injectable()
export class CacheService {
  private readonly logger = new LoggerService(CacheService.name);
  private readonly envPrefix: string;
  private readonly defaultTtl: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.envPrefix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const config = redisConfig(this.configService);
    this.defaultTtl = config.defaultTtl;
  }

  private buildKey(key: string, namespace?: string): string {
    const nsPart = namespace ? `${namespace}:` : '';
    return `${this.envPrefix}:${nsPart}${key}`;
  }

  async get<T>(key: string, namespace?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const value = await this.cacheManager.get<T>(fullKey);
      if (value !== null && value !== undefined) {
        this.logger.debug(`Cache HIT: ${fullKey}`);
        return value;
      }
      this.logger.debug(`Cache MISS: ${fullKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error: ${key}`, {
        stack: (error as Error).stack,
      });
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttl?: number,
    namespace?: string,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const ttlToUse = (ttl ?? this.defaultTtl) * 1000;
      await this.cacheManager.set(fullKey, value, ttlToUse);
      this.logger.debug(`Cache SET: ${fullKey} (TTL: ${ttlToUse}ms)`);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error: ${key}`, {
        stack: (error as Error).stack,
      });
      return false;
    }
  }

  async del(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      await this.cacheManager.del(fullKey);
      this.logger.debug(`Cache DELETED: ${fullKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error: ${key}`, {
        stack: (error as Error).stack,
      });
      return false;
    }
  }

  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    namespace?: string,
  ): Promise<T> {
    const cached = await this.get<T>(key, namespace);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttl, namespace);
    }
    return fresh;
  }
}
