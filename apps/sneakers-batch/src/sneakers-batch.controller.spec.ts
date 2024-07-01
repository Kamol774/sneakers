import { Test, TestingModule } from '@nestjs/testing';
import { SneakersBatchController } from './sneakers-batch.controller';
import { SneakersBatchService } from './sneakers-batch.service';

describe('SneakersBatchController', () => {
  let sneakersBatchController: SneakersBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SneakersBatchController],
      providers: [SneakersBatchService],
    }).compile();

    sneakersBatchController = app.get<SneakersBatchController>(SneakersBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(sneakersBatchController.getHello()).toBe('Hello World!');
    });
  });
});
