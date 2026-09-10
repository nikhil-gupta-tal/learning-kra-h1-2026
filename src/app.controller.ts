import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './common/decorators/is-public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @IsPublic()
  getHealthCheck() {
    return this.appService.getHealthCheck();
  }
}
