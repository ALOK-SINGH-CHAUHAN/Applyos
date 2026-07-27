import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async listExecutions(limit: number, offset: number) {
    const total = await this.prisma.automationExecution.count();
    const items = await this.prisma.automationExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        application: {
          include: {
            job: true,
            resumeVersion: true,
          },
        },
      },
    });
    return { items, total };
  }

  async getExecution(id: string) {
    return this.prisma.automationExecution.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: true,
            resumeVersion: true,
          },
        },
      },
    });
  }
}
