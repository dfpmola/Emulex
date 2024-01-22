import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,

      // Store-specific configurati
      socket: {
        host: '192.168.1.174',
        port: 6379,
      },
    }),

  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule { }
