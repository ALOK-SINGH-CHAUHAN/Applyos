import { Controller, Get, Request, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'OWNER')
  async listLogs(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    const workspaceId = req.user.workspaceId;
    return this.auditService.listLogs(workspaceId, limit, offset);
  }
}
