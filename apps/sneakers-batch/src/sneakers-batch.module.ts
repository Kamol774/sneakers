import { Module } from '@nestjs/common';
import { SneakersBatchController } from './sneakers-batch.controller';
import { SneakersBatchService } from './sneakers-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [SneakersBatchController],
  providers: [SneakersBatchService],
})
export class SneakersBatchModule {}
