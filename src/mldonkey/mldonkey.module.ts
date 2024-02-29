import { Module } from '@nestjs/common';
import { MldonkeyService } from './mldonkey.service';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';

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
  providers: [MldonkeyService]
})
export class MldonkeyModule { }
