import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId?: string) {
    const appWhere = userId ? { userId } : {};

    // ── Application funnel counts ────────────────────────────────────────────
    const statusCounts = await this.prisma.application.groupBy({
      by: ['status'],
      where: appWhere,
      _count: { id: true },
    });

    const funnel: Record<string, number> = {};
    for (const row of statusCounts) {
      funnel[row.status] = row._count.id;
    }

    // ── Total applications ───────────────────────────────────────────────────
    const totalApplications = Object.values(funnel).reduce((s, n) => s + n, 0);

    // ── Success metrics ──────────────────────────────────────────────────────
    const submitted = (funnel['SUBMITTED'] ?? 0)
      + (funnel['VERIFIED'] ?? 0)
      + (funnel['COMPLETED'] ?? 0)
      + (funnel['INTERVIEW'] ?? 0)
      + (funnel['OFFER'] ?? 0);
    const interviews = (funnel['INTERVIEW'] ?? 0) + (funnel['OFFER'] ?? 0);
    const offers = funnel['OFFER'] ?? 0;

    const submitRate = totalApplications > 0 ? Math.round((submitted / totalApplications) * 100) : 0;
    const interviewRate = submitted > 0 ? Math.round((interviews / submitted) * 100) : 0;
    const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

    // ── Per-platform success rates ───────────────────────────────────────────
    const appsWithJobs = await this.prisma.application.findMany({
      where: appWhere,
      select: {
        status: true,
        job: { select: { sourcePlatform: true } },
      },
    });

    const platformMap: Record<string, { total: number; submitted: number }> = {};
    for (const app of appsWithJobs) {
      const platform = app.job.sourcePlatform || 'unknown';
      if (!platformMap[platform]) platformMap[platform] = { total: 0, submitted: 0 };
      platformMap[platform].total++;
      if (['SUBMITTED', 'VERIFIED', 'COMPLETED', 'INTERVIEW', 'OFFER'].includes(app.status)) {
        platformMap[platform].submitted++;
      }
    }

    const platformStats = Object.entries(platformMap).map(([platform, { total, submitted }]) => ({
      platform,
      total,
      submitted,
      successRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // ── Resume usage leaderboard ─────────────────────────────────────────────
    const resumeUsage = await this.prisma.application.groupBy({
      by: ['resumeVersionId'],
      where: appWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topResumes = await Promise.all(
      resumeUsage.map(async (row) => {
        const version = await this.prisma.resumeVersion.findUnique({
          where: { id: row.resumeVersionId },
          select: {
            atsScore: true,
            resume: { select: { title: true } },
          },
        });
        return {
          resumeVersionId: row.resumeVersionId,
          title: version?.resume?.title ?? 'Unknown',
          usageCount: row._count.id,
          atsScore: version?.atsScore ?? null,
        };
      })
    );

    // ── Last 30 days daily application trend ─────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApps = await this.prisma.application.findMany({
      where: { ...appWhere, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket by date string
    const dailyMap: Record<string, number> = {};
    for (const app of recentApps) {
      const day = app.createdAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
    }
    const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // ── AI Execution Analytics ────────────────────────────────────────────────
    const thirtyDaysAgoAI = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const aiExecutions = await this.prisma.aIExecution.findMany({
      where: { createdAt: { gte: thirtyDaysAgoAI } },
      select: {
        provider: true,
        latencyMs: true,
        cost: true,
        cacheStatus: true,
        httpStatus: true,
        totalTokens: true,
        feature: true,
        createdAt: true,
      },
    });

    const totalResumes = await this.prisma.resume.count(userId ? { where: { userId } } : undefined);
    const totalJobs = await this.prisma.job.count(userId ? { where: { applications: { some: { userId } } } } : undefined);

    // Build per-provider stats
    const providerMap: Record<string, { calls: number; success: number; totalLatency: number; totalCost: number; cacheHits: number }> = {};
    let totalCost = 0;
    let totalCacheHits = 0;

    for (const exec of aiExecutions) {
      const p = exec.provider || 'unknown';
      if (!providerMap[p]) providerMap[p] = { calls: 0, success: 0, totalLatency: 0, totalCost: 0, cacheHits: 0 };
      providerMap[p].calls++;
      if ((exec.httpStatus || 200) < 400) providerMap[p].success++;
      providerMap[p].totalLatency += exec.latencyMs || 0;
      const execCost = exec.cost ? (exec.cost as any).toNumber() : 0;
      providerMap[p].totalCost += execCost;
      if (exec.cacheStatus === 'HIT') { providerMap[p].cacheHits++; totalCacheHits++; }
      totalCost += execCost;
    }

    const providerStats = Object.entries(providerMap).map(([provider, stats]) => ({
      provider,
      calls: stats.calls,
      successRate: stats.calls > 0 ? Math.round((stats.success / stats.calls) * 100) : 0,
      avgLatencyMs: stats.calls > 0 ? Math.round(stats.totalLatency / stats.calls) : 0,
      totalCost: Math.round(stats.totalCost * 100000) / 100000, // 5 decimal places
      cacheHits: stats.cacheHits,
    })).sort((a, b) => b.calls - a.calls);

    const aiStats = {
      totalCalls: aiExecutions.length,
      cacheHitRate: aiExecutions.length > 0 ? Math.round((totalCacheHits / aiExecutions.length) * 100) : 0,
      totalCost: Math.round(totalCost * 100000) / 100000,
      providerStats,
    };

    return {
      overview: {
        totalApplications,
        totalResumes,
        totalJobs,
        submitted,
        interviews,
        offers,
        submitRate,
        interviewRate,
        offerRate,
      },
      funnel,
      platformStats,
      topResumes,
      dailyTrend,
      aiStats,
    };
  }
}
