import { Test, TestingModule } from '@nestjs/testing';
import { MldonkeyService } from './mldonkey.service';

describe('MldonkeyService', () => {
  let service: MldonkeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MldonkeyService],
    }).compile();

    service = module.get<MldonkeyService>(MldonkeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
