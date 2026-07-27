import { Controller, Post, Get, Param, Body, BadRequestException, Patch, Req } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async createApplication(@Body() body: any, @Req() req: any) {
    const jobId = body?.jobId;
    const resumeVersionId = body?.resumeVersionId;

    if (!jobId || !resumeVersionId) {
      throw new BadRequestException('jobId and resumeVersionId are required');
    }

    return this.applicationsService.createApplication(jobId, resumeVersionId, req.user?.id);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async listApplications(@Req() req: any) {
    return this.applicationsService.listApplications(req.user?.id);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getApplication(@Param('id') id: string) {
    return this.applicationsService.getApplication(id);
  }

  @Post(':id/approve')
  @Roles(Role.OWNER, Role.ADMIN)
  async approveApplication(@Param('id') id: string, @Req() req: any) {
    return this.applicationsService.approveApplication(id, req.user?.id);
  }

  @Post(':id/start')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async startApplication(@Param('id') id: string, @Req() req: any) {
    return this.applicationsService.startApplication(id, req.user?.id);
  }

  @Patch(':id/cover-letter')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async updateCoverLetter(@Param('id') id: string, @Body('content') content: string, @Req() req: any) {
    if (!content) {
      throw new BadRequestException('Cover letter content is required');
    }
    return this.applicationsService.updateCoverLetter(id, content, req.user?.id);
  }

  @Patch(':id/status')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async updateStatus(@Param('id') id: string, @Body('status') status: any, @Req() req: any) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.applicationsService.updateStatus(id, status, req.user?.id);
  }

  @Get(':id/progress')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getApplicationProgress(@Param('id') id: string) { console.log("CALLED PROGRESS FOR ID:", id);
    return this.applicationsService.getApplicationProgress(id);
  }
}
