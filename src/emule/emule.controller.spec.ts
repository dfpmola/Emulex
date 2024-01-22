import { Test, TestingModule } from '@nestjs/testing';
import { EmuleController } from './emule.controller';

describe('EmuleController', () => {
  let controller: EmuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmuleController],
    }).compile();

    controller = module.get<EmuleController>(EmuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
