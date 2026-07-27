import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ResumesModule } from './resumes/resumes.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PluginsModule } from './plugins/plugins.module';
import { JobProvidersModule } from './job-providers/job-providers.module';
import { AuditModule } from './audit/audit.module';
import { AiObservabilityModule } from './ai-observability/ai-observability.module';
import { AutomationModule } from './automation/automation.module';
import { FilesController } from './files.controller';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule,
    HealthModule,
    ResumesModule,

    JobsModule,
    ApplicationsModule,
    AuthModule,
    AnalyticsModule,
    PluginsModule,
    JobProvidersModule,
    AuditModule,
    AiObservabilityModule,
    AutomationModule,
  ],
  controllers: [FilesController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
