import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(workspaceId: string, limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: {
        user: {
          workspaceId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async createLog(userId: string, action: string, resourceType: string, resourceId: string, metadataJson?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        metadataJson: metadataJson || {},
      },
    });
  }
}
