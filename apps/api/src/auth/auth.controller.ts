import { Body, BadRequestException, Controller, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  private signUserToken(user: { id: string; role: string; workspaceId: string }) {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-123';

    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      secret,
      { expiresIn: '7d' }
    );
  }

  @Post('token')
  async exchangeToken(
    @Body('userId') userId: string,
    @Body('role') role: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // Try finding user by ID
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Fallback: If not found, try to locate by role prefix mock pattern
    if (!user) {
      const email = `${userId.toLowerCase()}@autoapply.ai`;
      user = await this.prisma.user.findFirst({
        where: { email },
      });
    }

    if (!user) {
      throw new NotFoundException(`User not found for identity: ${userId}`);
    }

    const token = this.signUserToken({
      id: user.id,
      role: role || user.role,
      workspaceId: user.workspaceId,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role || user.role,
        workspaceId: user.workspaceId,
      },
    };
  }

  @Post('google')
  async googleLogin(@Body('credential') credential: string) {
    if (!credential) {
      throw new BadRequestException('Google credential is required');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Verified Google email is required');
    }

    let workspace = await this.prisma.workspace.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          name: 'AutoApply Workspace',
          plan: 'free',
        },
      });
    }

    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name || payload.email.split('@')[0],
      },
      create: {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        role: 'OPERATOR',
        workspaceId: workspace.id,
      },
    });

    const token = this.signUserToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        image: payload.picture || null,
      },
    };
  }
}
