import { Module } from '@nestjs/common';
import { EmuleService } from './emule.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HttpModule } from '@nestjs/axios';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { EmulexRequestConsumer } from '../emulex/consumers/emulex-request.consumer';
import { EmulexSearchConsumer } from '../emulex/consumers/emulex-search.comsumer';
import { EmulexSearchResultConsumer } from '../emulex/consumers/emulex-searchResult.comsumer';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    BullModule.registerQueue({
      name: "emulexRequest"
    },
      {
        name: 'emulexSearch',
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
      name: 'emulexRequest',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    },
      {
        name: 'emulexSearch',
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
  providers: [EmuleService],
  exports: [BullModule, EmuleService]
})
export class EmuleModule { }
