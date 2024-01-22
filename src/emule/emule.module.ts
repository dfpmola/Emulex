import { Module } from '@nestjs/common';
import { EmuleService } from './emule.service';
import { EmuleController } from './emule.controller';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HttpModule } from '@nestjs/axios';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { EmuleRequestConsumer } from './consumers/emule-request.consumer';
import { EmuleSearchConsumer } from './consumers/emule-search.comsumer';
@Module({
  imports: [
    BullModule.registerQueue({
      name: "emuleRequest"
    },
      {
        name: 'emuleSearch'
      }
    ),
    BullBoardModule.forFeature({
      name: 'emuleRequest',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    },
      {
        name: 'emuleSearch',
        adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
      }),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
    RedisCacheModule,
  ],
  providers: [EmuleService, EmuleRequestConsumer, EmuleSearchConsumer],
  controllers: [EmuleController]
})
export class EmuleModule { }
