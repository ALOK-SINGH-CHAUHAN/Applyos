import { Controller, Get, Patch, Body, Param, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { PluginsService } from './plugins.service';

@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  @Roles('VIEWER', 'OPERATOR', 'ADMIN', 'OWNER')
  async listPlugins(@Request() req: any) {
    const workspaceId = req.user.workspaceId;
    return this.pluginsService.listPlugins(workspaceId);
  }

  @Patch(':name')
  @Roles('ADMIN', 'OWNER')
  async configurePlugin(
    @Request() req: any,
    @Param('name') name: string,
    @Body() body: {
      enabled?: boolean;
      autoSubmitAllowed?: boolean;
      configJson?: any;
      credentialsPlain?: string;
    }
  ) {
    const workspaceId = req.user.workspaceId;
    return this.pluginsService.configurePlugin(workspaceId, name, body, req.user?.id);
  }
}
