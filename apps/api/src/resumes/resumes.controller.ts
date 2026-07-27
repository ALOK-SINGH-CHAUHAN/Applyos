import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, HttpCode, HttpStatus, Req, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadResume(@UploadedFile() file: any, @Req() req: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.resumesService.uploadResume(file.originalname, file.buffer, file.mimetype, req.user?.id);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async listResumes(@Req() req: any) {
    return this.resumesService.listResumes(req.user?.id);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getResume(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.getResume(id, req.user?.id);
  }

  @Get(':id/intelligence')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getResumeIntelligence(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.getResumeIntelligence(id, req.user?.id);
  }

  @Post(':id/analyze')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async analyzeResume(@Param('id') id: string, @Body() body: { force?: boolean }) {
    return this.resumesService.analyzeResume(id, body.force);
  }

  @Post(':resumeVersionId/compare/:jobId')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async compareResume(
    @Param('resumeVersionId') resumeVersionId: string,
    @Param('jobId') jobId: string
  ) {
    return this.resumesService.compareResume(resumeVersionId, jobId);
  }

  @Get(':resumeVersionId/matches')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getResumeMatches(@Param('resumeVersionId') resumeVersionId: string) {
    return this.resumesService.getResumeMatches(resumeVersionId);
  }

  @Post(':resumeVersionId/tailor/:jobId')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async tailorResume(
    @Param('resumeVersionId') resumeVersionId: string,
    @Param('jobId') jobId: string
  ) {
    return this.resumesService.tailorResume(resumeVersionId, jobId);
  }

  @Get('matches/status/:jobId')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getMatchJobStatus(@Param('jobId') jobId: string) {
    return this.resumesService.getMatchJobStatus(jobId);
  }

  @Get(':id/analyze/status/:jobId')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getAnalyzeStatus(@Param('id') id: string, @Param('jobId') jobId: string, @Req() req: any) {
    if (jobId === 'cached') {
      return { status: 'COMPLETED', progress: { percent: 100, step: 'Complete', estTimeRemaining: '0s' } };
    }
    
    let job;
    if (jobId === 'active') {
      job = await this.resumesService.getActiveJobForResume(id);
    } else {
      job = await this.resumesService.getJobStatus(jobId);
    }

    if (!job) {
      const resume = await this.resumesService.getResume(id, req.user?.id);
      if (resume?.status === 'READY') {
        return { status: 'COMPLETED', progress: { percent: 100, step: 'Complete', estTimeRemaining: '0s' } };
      }
      return { status: 'FAILED', progress: { percent: 0, step: 'Job not found', estTimeRemaining: '0s' } };
    }
    
    const state = await job.getState();
    const progress = job.progress || { percent: 0, step: 'Queued', estTimeRemaining: '30s' };
    
    return {
      status: state.toUpperCase(),
      jobId: job.id,
      progress,
    };
  }

  @Get(':id/download')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.resumesService.generatePdf(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=resume-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }
}
