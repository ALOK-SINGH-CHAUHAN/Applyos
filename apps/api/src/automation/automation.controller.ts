import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AutomationService } from './automation.service';

@Controller('automation')
@Roles('ADMIN', 'OWNER')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('executions')
  async listExecutions(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    return this.automationService.listExecutions(limit, offset);
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    return this.automationService.getExecution(id);
  }
}
