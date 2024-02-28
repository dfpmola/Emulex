import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmuleModule } from './emule/emule.module';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { ConfigModule } from '@nestjs/config';
import { MldonkeyModule } from './mldonkey/mldonkey.module';
import { EmulexDynamicModule } from './emulex/emulex.module';


@Module({
  imports: [
    EmulexDynamicModule.forRoot(),
    EmuleModule,
    MldonkeyModule,
    BullModule.forRoot({
      redis: {
        host: '192.168.1.174',
        port: 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter // Or FastifyAdapter from `@bull-board/fastify`
    }),
    RedisCacheModule,
    ConfigModule.forRoot(),


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }