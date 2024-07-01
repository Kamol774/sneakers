import { Controller, Get } from '@nestjs/common';
import { SneakersBatchService } from './sneakers-batch.service';

@Controller()
export class SneakersBatchController {
  constructor(private readonly sneakersBatchService: SneakersBatchService) {}

  @Get()
  getHello(): string {
    return this.sneakersBatchService.getHello();
  }
}
