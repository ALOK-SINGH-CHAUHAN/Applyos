import { Controller, Get, Post, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AiObservabilityService } from './ai-observability.service';

@Controller('ai-observability')
@Roles('ADMIN', 'OWNER')
export class AiObservabilityController {
  constructor(private readonly observabilityService: AiObservabilityService) {}

  @Get('executions')
  async listExecutions(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    return this.observabilityService.listExecutions(limit, offset);
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    return this.observabilityService.getExecution(id);
  }

  @Post('test-cache-compare')
  async testCacheCompare() {
    return this.observabilityService.testCacheCompare();
  }

  @Get('report')
  async getVerificationReport() {
    return this.observabilityService.getVerificationReport();
  }
}
