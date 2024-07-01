import { Injectable } from '@nestjs/common';

@Injectable()
export class SneakersBatchService {
  getHello(): string {
    return 'Welcome to SNEAKERS-BATCH server!';
  }
}
