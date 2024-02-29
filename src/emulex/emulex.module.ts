import { EmulexController } from './emulex.controller';
import { EmuleService } from 'src/emule/emule.service';
import { MldonkeyService } from 'src/mldonkey/mldonkey.service';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { DynamicModule, Module } from '@nestjs/common';
import { EmulexRequestConsumer } from './consumers/emulex-request.consumer';
import { EmulexSearchConsumer } from './consumers/emulex-search.comsumer';
import { EmulexSearchResultConsumer } from './consumers/emulex-searchResult.comsumer';

@Module({})
export class EmulexDynamicModule {
  static forRoot(): DynamicModule {
    const serviceProvider = {
      provide: 'EmulexServiceInterface',
      useClass: process.env.MODE === 'emule' ? EmuleService : MldonkeyService,
    };

    return {
      module: EmulexDynamicModule,
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
      controllers: [EmulexController],
      providers: [serviceProvider, EmulexRequestConsumer, EmulexSearchConsumer, EmulexSearchResultConsumer],
      exports: [serviceProvider]
    }
  }
}