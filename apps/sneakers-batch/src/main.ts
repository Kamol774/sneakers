import { NestFactory } from '@nestjs/core';
import { SneakersBatchModule } from './sneakers-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(SneakersBatchModule);
  await app.listen(3000);
}
bootstrap();
