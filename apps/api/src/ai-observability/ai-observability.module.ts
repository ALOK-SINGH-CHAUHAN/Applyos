import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiObservabilityService } from './ai-observability.service';
import { AiObservabilityController } from './ai-observability.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiObservabilityController],
  providers: [AiObservabilityService],
  exports: [AiObservabilityService],
})
export class AiObservabilityModule {}
