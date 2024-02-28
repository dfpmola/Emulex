import { Module } from '@nestjs/common';
import { EmuleService } from './emule.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HttpModule } from '@nestjs/axios';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { EmuleRequestConsumer } from './consumers/emule-request.consumer';
import { EmuleSearchConsumer } from './consumers/emule-search.comsumer';
import { EmuleSearchResultConsumer } from './consumers/emule-searchResult.comsumer';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    BullModule.registerQueue({
      name: "emuleRequest"
    },
      {
        name: 'emuleSearch',
        settings: {
          lockDuration: 300000,
        }
      },
      {
        name: 'emuleSearchResult',
        settings: {
          lockDuration: 300000,
        }
      }
    ),
    BullBoardModule.forFeature({
      name: 'emuleRequest',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    },
      {
        name: 'emuleSearch',
        adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
      },
      {
        name: 'emuleSearchResult',
        adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
      }),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
    RedisCacheModule,
    CacheModule.register(),
    ConfigModule
  ],
  providers: [EmuleService, EmuleRequestConsumer, EmuleSearchConsumer, EmuleSearchResultConsumer],
  exports: [BullModule, EmuleService]
})
export class EmuleModule { }
