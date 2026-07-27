import { Controller, Get, Post, Patch, Param, Body, Request } from '@nestjs/common';
import { JobProvidersService } from './job-providers.service';
import { Roles } from '../auth/roles.decorator';

@Controller('job-providers')
export class JobProvidersController {
  constructor(private readonly providersService: JobProvidersService) {}

  @Get()
  @Roles('VIEWER', 'OPERATOR', 'ADMIN', 'OWNER')
  async listProviders() {
    return this.providersService.listProviders();
  }

  @Patch(':name')
  @Roles('ADMIN', 'OWNER')
  async configureProvider(
    @Param('name') name: string,
    @Body() body: { enabled?: boolean; credentialsJson?: any }
  ) {
    return this.providersService.configureProvider(name, body);
  }

  @Post(':name/test')
  @Roles('ADMIN', 'OWNER')
  async testConnection(@Param('name') name: string) {
    return this.providersService.testConnection(name);
  }

  @Post(':name/sync')
  @Roles('ADMIN', 'OWNER')
  async triggerSync(@Param('name') name: string) {
    return this.providersService.triggerSync(name);
  }
}
