import { Controller, Post, Get, Param, Body, BadRequestException, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import * as path from 'path';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async importJob(@Body() body: any, @Request() req: any) {
    const url = body?.url;
    const descriptionRaw = body?.descriptionRaw;

    if (!url && !descriptionRaw) {
      throw new BadRequestException('Either Job URL or raw Job Description is required');
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        throw new BadRequestException('Invalid job URL format');
      }
      return this.jobsService.importJob({ url, userId: req.user?.id });
    } else {
      return this.jobsService.importJob({ descriptionRaw, userId: req.user?.id });
    }
  }

  @Post('upload')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  @UseInterceptors(FileInterceptor('file'))
  async uploadJobPdf(@UploadedFile() file: any, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let descriptionRaw = '';
    const ext = path.extname(file.originalname).toLowerCase();
    
    try {
      if (ext === '.pdf') {
        const parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        await parser.destroy();
        descriptionRaw = result.text;
      } else {
        descriptionRaw = file.buffer.toString('utf-8');
      }
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse file: ${err.message}`);
    }

    if (!descriptionRaw.trim()) {
      throw new BadRequestException('Uploaded file is empty or could not be parsed');
    }

    const title = file.originalname.replace(/\.[^/.]+$/, "");
    return this.jobsService.importJob({ descriptionRaw, title, userId: req.user?.id });
  }

  @Post('bulk')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async bulkImportJobs(@Body() body: any, @Request() req: any) {
    const urls = body?.urls;
    if (!urls || !Array.isArray(urls)) {
      throw new BadRequestException('URLs array is required');
    }
    const results = [];
    for (const url of urls) {
      try {
        new URL(url);
        const job = await this.jobsService.importJob({ url, userId: req.user?.id });
        results.push(job);
      } catch (err) {
        results.push({ url, error: 'Invalid URL format' });
      }
    }
    return results;
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async listJobs() {
    return this.jobsService.listJobs();
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR, Role.VIEWER)
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Post(':id/match')
  @Roles(Role.OWNER, Role.ADMIN, Role.OPERATOR)
  async matchResumes(@Param('id') id: string) {
    return this.jobsService.matchResumes(id);
  }
}
