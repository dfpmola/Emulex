import { Module } from '@nestjs/common';
import { MldonkeyService } from './mldonkey.service';

@Module({
  providers: [MldonkeyService]
})
export class MldonkeyModule {}
