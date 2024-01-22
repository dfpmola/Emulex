import { Test, TestingModule } from '@nestjs/testing';
import { EmuleService } from './emule.service';

describe('EmuleService', () => {
  let service: EmuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmuleService],
    }).compile();

    service = module.get<EmuleService>(EmuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
