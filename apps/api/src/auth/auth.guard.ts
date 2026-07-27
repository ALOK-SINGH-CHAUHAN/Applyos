import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const xUserId = request.headers['x-user-id'];
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (xUserId) {
      token = String(xUserId).trim();
    }

    if (!token) {
      return true;
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key-123';

    try {
      // 1. Attempt decoding as signed JWT
      const decoded = jwt.verify(token, secret) as any;
      if (decoded && decoded.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { workspace: true },
        });
        if (user) {
          request.user = {
            ...user,
            role: decoded.role || user.role, // Support local role switcher override
          };
        }
        return true;
      }
    } catch (err) {
      // Fall through to legacy plain text check
    }

    // 2. Legacy Plain-Text / Development Identifier Fallback
    let user = await this.prisma.user.findUnique({
      where: { id: token },
      include: { workspace: true },
    });

    if (!user) {
      const email = `${token.toLowerCase()}@autoapply.ai`;
      user = await this.prisma.user.findFirst({
        where: { email },
        include: { workspace: true },
      });
    }

    if (user) {
      request.user = user;
    }

    return true;
  }
}
