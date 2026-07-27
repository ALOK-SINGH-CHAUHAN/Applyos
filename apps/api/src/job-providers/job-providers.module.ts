import { Module } from '@nestjs/common';
import { JobProvidersController } from './job-providers.controller';
import { JobProvidersService } from './job-providers.service';

@Module({
  controllers: [JobProvidersController],
  providers: [JobProvidersService],
  exports: [JobProvidersService],
})
export class JobProvidersModule {}
