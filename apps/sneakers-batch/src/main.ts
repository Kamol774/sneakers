import { NestFactory } from '@nestjs/core';
import { SneakersBatchModule } from './sneakers-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(SneakersBatchModule);
  await app.listen(process.env.PORT_BATCH ?? 3000);
}
bootstrap();
