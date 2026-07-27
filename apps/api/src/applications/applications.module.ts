import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { OrchestrationService } from './orchestration.service';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, OrchestrationService],
  exports: [ApplicationsService, OrchestrationService],
})
export class ApplicationsModule {}
