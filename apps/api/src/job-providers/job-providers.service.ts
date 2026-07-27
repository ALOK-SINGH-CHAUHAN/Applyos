import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobDiscoveryService, TestResult } from '../../../workers/src/discovery.service';
import { Queue } from 'bullmq';

@Injectable()
export class JobProvidersService {
  private discoveryService = new JobDiscoveryService();
  private jobQueue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.jobQueue = new Queue('job-process', {
      connection: { host: redisHost, port: redisPort },
    });
  }

  // Pre-seed default configuration database states on demand
  private async getOrCreateConfig(providerName: string) {
    let config = await this.prisma.jobProviderConfiguration.findUnique({
      where: { providerName },
    });

    if (!config) {
      config = await this.prisma.jobProviderConfiguration.create({
        data: {
          providerName,
          enabled: true,
          credentialsJson: {},
          boardsSynced: providerName === 'company_careers' ? 10 : 0,
          jobsImported: 0,
        },
      });
    }
    return config;
  }

  async listProviders() {
    const names = ['greenhouse', 'lever', 'ashby', 'remoteok', 'company_careers'];
    const results = [];

    for (const name of names) {
      const dbConfig = await this.getOrCreateConfig(name);
      const provider = this.discoveryService.getProvider(name);

      results.push({
        name,
        enabled: dbConfig.enabled,
        supportsAuthentication: provider ? provider.supportsAuthentication() : false,
        credentials: dbConfig.credentialsJson || {},
        boardsSynced: dbConfig.boardsSynced,
        jobsImported: dbConfig.jobsImported,
        lastSyncAt: dbConfig.lastSyncAt,
      });
    }

    return results;
  }

  async configureProvider(
    name: string,
    data: { enabled?: boolean; credentialsJson?: any }
  ) {
    const provider = this.discoveryService.getProvider(name);
    if (!provider) {
      throw new NotFoundException(`Job Provider ${name} not found`);
    }

    await this.getOrCreateConfig(name);

    return this.prisma.jobProviderConfiguration.update({
      where: { providerName: name },
      data: {
        enabled: data.enabled !== undefined ? data.enabled : undefined,
        credentialsJson: data.credentialsJson !== undefined ? data.credentialsJson : undefined,
      },
    });
  }

  async testConnection(name: string): Promise<TestResult> {
    const provider = this.discoveryService.getProvider(name);
    if (!provider) {
      throw new NotFoundException(`Job Provider ${name} not found`);
    }

    const dbConfig = await this.getOrCreateConfig(name);
    const config = dbConfig.credentialsJson || {};

    const test = await provider.testConnection(config);

    // Save success metrics in config database record if connected
    if (test.status === 'Connected' && test.metrics) {
      await this.prisma.jobProviderConfiguration.update({
        where: { providerName: name },
        data: {
          boardsSynced: test.metrics.boardsSynced ?? dbConfig.boardsSynced,
          jobsImported: dbConfig.jobsImported + (test.metrics.jobsFound ?? 0),
        },
      });
    }

    return test;
  }

  async triggerSync(name: string) {
    const provider = this.discoveryService.getProvider(name);
    if (!provider) {
      throw new NotFoundException(`Job Provider ${name} not found`);
    }

    const dbConfig = await this.getOrCreateConfig(name);
    if (!dbConfig.enabled) {
      throw new Error(`Job Provider ${name} is currently disabled`);
    }

    // Add immediate BullMQ task to poll jobs
    await this.jobQueue.add('sync-provider', { providerName: name });

    // Update last sync stamp
    await this.prisma.jobProviderConfiguration.update({
      where: { providerName: name },
      data: { lastSyncAt: new Date() },
    });

    return { status: 'Sync triggered', providerName: name };
  }
}
