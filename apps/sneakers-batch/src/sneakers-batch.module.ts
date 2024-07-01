import { Module } from '@nestjs/common';
import { SneakersBatchController } from './sneakers-batch.controller';
import { SneakersBatchService } from './sneakers-batch.service';

@Module({
  imports: [],
  controllers: [SneakersBatchController],
  providers: [SneakersBatchService],
})
export class SneakersBatchModule {}
