import { Controller, Get, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  @Roles('VIEWER', 'OPERATOR', 'ADMIN', 'OWNER')
  async getSummary(@Request() req: any) {
    const userId = req.user?.id;
    return this.analytics.getSummary(userId);
  }
}
