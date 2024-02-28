import { Test, TestingModule } from '@nestjs/testing';
import { EmulexController } from './emulex.controller';

describe('EmulexController', () => {
  let controller: EmulexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmulexController],
    }).compile();

    controller = module.get<EmulexController>(EmulexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
