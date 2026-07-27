'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';

interface OverviewStats {
  totalApplications: number;
  totalResumes: number;
  totalJobs: number;
  submitted: number;
  interviews: number;
  offers: number;
  submitRate: number;
  interviewRate: number;
  offerRate: number;
}

interface PlatformStat {
  platform: string;
  total: number;
  submitted: number;
  successRate: number;
}

interface TopResume {
  resumeVersionId: string;
  title: string;
  usageCount: number;
  atsScore: number | null;
}

interface DailyTrend {
  date: string;
  count: number;
}

interface AIProviderStat {
  provider: string;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
  totalCost: number;
  cacheHits: number;
}

interface AiStats {
  totalCalls: number;
  cacheHitRate: number;
  totalCost: number;
  providerStats: AIProviderStat[];
}

interface AnalyticsData {
  overview: OverviewStats;
  funnel: Record<string, number>;
  platformStats: PlatformStat[];
  topResumes: TopResume[];
  dailyTrend: DailyTrend[];
  aiStats?: AiStats;
}

function AnalyticsDashboard() {
  const { authHeaders } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/v1/analytics/summary', {
        headers: authHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [authHeaders]);

  return (
    <div className="min-h-screen bg-drafting-gray text-ink font-sans antialiased flex flex-col">
      {/* Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-[#19a05f] to-[#0d7f8c] py-2.5 px-4 text-center z-50">
        <p className="text-sm font-medium text-white">
          AutoApply Autopilot is now in public beta.{' '}
          <a href="/" className="underline underline-offset-2 hover:text-white/80 transition-colors ml-1 inline-flex items-center gap-0.5">
            Return to main site <span className="text-xs">→</span>
          </a>
        </p>
      </div>

      {/* Navigation Bar */}
      <AppHeader />

      {/* Main Console Workspace */}
      <div className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
            Analytics Overview
          </h1>
          <p className="text-steel text-sm mt-2">
            Deconstruct application funnel dynamics, resume leaderboard success rates, and platform conversions.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4 bg-marble border border-hairline rounded-card">
            <div className="w-8 h-8 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-steel font-mono">Loading data points...</p>
          </div>
        ) : !data ? (
          <div className="py-20 text-center bg-marble border border-hairline rounded-card text-steel">
            Failed to retrieve workspace metrics.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-marble border border-hairline p-5 rounded-card flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ash font-bold font-mono">Total Applications</span>
                <span className="text-3xl font-bold text-ink mt-2 font-mono">{data.overview.totalApplications}</span>
                <span className="text-[11px] text-steel mt-1 font-mono">{data.overview.totalResumes} Resumes · {data.overview.totalJobs} Jobs</span>
              </div>
              <div className="bg-marble border border-hairline p-5 rounded-card flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ash font-bold font-mono">Submitted & Active</span>
                <span className="text-3xl font-bold text-success mt-2 font-mono">{data.overview.submitted}</span>
                <span className="text-[11px] text-steel mt-1 font-mono">{data.overview.submitRate}% Submission Rate</span>
              </div>
              <div className="bg-marble border border-hairline p-5 rounded-card flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ash font-bold font-mono">Interviewing</span>
                <span className="text-3xl font-bold text-progress mt-2 font-mono">{data.overview.interviews}</span>
                <span className="text-[11px] text-steel mt-1 font-mono">{data.overview.interviewRate}% Conversion Rate</span>
              </div>
              <div className="bg-marble border border-hairline p-5 rounded-card flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ash font-bold font-mono">Offers Accepted</span>
                <span className="text-3xl font-bold text-ink mt-2 font-mono">{data.overview.offers}</span>
                <span className="text-[11px] text-steel mt-1 font-mono">{data.overview.offerRate}% Close Rate</span>
              </div>
            </div>

            {/* Visual Funnel and Platform Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Funnel chart */}
              <div className="bg-marble border border-hairline p-6 rounded-card space-y-6 lg:col-span-1">
                <h3 className="font-semibold text-base text-ink tracking-tight border-b border-hairline pb-3">Application Funnel</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-steel">1. Tailored & Ready</span>
                      <span className="text-ink font-semibold">{data.overview.totalApplications}</span>
                    </div>
                    <div className="w-full h-2.5 bg-drafting-gray rounded-pill overflow-hidden">
                      <div className="h-full bg-ink rounded-pill" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-steel">2. Submitted to Sites</span>
                      <span className="text-ink font-semibold">{data.overview.submitted}</span>
                    </div>
                    <div className="w-full h-2.5 bg-drafting-gray rounded-pill overflow-hidden">
                      <div className="h-full bg-success rounded-pill" style={{ width: `${data.overview.submitRate}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-steel">3. Passed to Interview</span>
                      <span className="text-ink font-semibold">{data.overview.interviews}</span>
                    </div>
                    <div className="w-full h-2.5 bg-drafting-gray rounded-pill overflow-hidden">
                      <div className="h-full bg-progress rounded-pill" style={{ width: `${Math.round((data.overview.interviews / (data.overview.totalApplications || 1)) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-steel">4. Received Offer</span>
                      <span className="text-ink font-semibold">{data.overview.offers}</span>
                    </div>
                    <div className="w-full h-2.5 bg-drafting-gray rounded-pill overflow-hidden">
                      <div className="h-full bg-mint-signal bg-[#00f2e6] rounded-pill" style={{ width: `${Math.round((data.overview.offers / (data.overview.totalApplications || 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform conversions */}
              <div className="bg-marble border border-hairline p-6 rounded-card space-y-4 lg:col-span-2">
                <h3 className="font-semibold text-base text-ink tracking-tight border-b border-hairline pb-3">Platform Conversions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-hairline text-ash uppercase tracking-wider">
                        <th className="py-2.5 font-bold">Platform</th>
                        <th className="py-2.5 font-bold text-center">Applications</th>
                        <th className="py-2.5 font-bold text-center">Submitted</th>
                        <th className="py-2.5 font-bold text-right">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {data.platformStats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-drafting-gray/20">
                          <td className="py-3 font-semibold text-ink capitalize">{stat.platform}</td>
                          <td className="py-3 text-center text-steel">{stat.total}</td>
                          <td className="py-3 text-center text-steel">{stat.submitted}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-pill font-bold ${
                              stat.successRate >= 75 ? 'bg-[#e7f6ed] text-[#19a05f]' :
                              stat.successRate >= 40 ? 'bg-[#e0f7ff] text-[#00b9f1]' :
                              'bg-[#feebeb] text-[#d64545]'
                            }`}>
                              {stat.successRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.platformStats.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-steel">
                            No application logs recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Resume Usage & Daily Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resume usage */}
              <div className="bg-marble border border-hairline p-6 rounded-card space-y-4">
                <h3 className="font-semibold text-base text-ink tracking-tight border-b border-hairline pb-3">Resume Leaderboard</h3>
                <div className="space-y-4">
                  {data.topResumes.map((resume, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4 text-xs font-mono">
                      <div className="min-w-0 flex-grow">
                        <div className="font-semibold text-ink truncate" title={resume.title}>{resume.title}</div>
                        <div className="text-[10px] text-steel mt-0.5">Used in {resume.usageCount} application(s)</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {resume.atsScore !== null && (
                          <span className="text-[10px] font-bold bg-[#e6f8f5] text-[#0d7f8c] px-2 py-0.5 rounded-pill">
                            ATS Score: {resume.atsScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.topResumes.length === 0 && (
                    <div className="py-8 text-center text-steel text-xs">
                      No resume usage metrics recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Applications Trend */}
              <div className="bg-marble border border-hairline p-6 rounded-card space-y-4">
                <h3 className="font-semibold text-base text-ink tracking-tight border-b border-hairline pb-3">30-Day Activity</h3>
                <div className="h-48 flex items-end gap-1 border-b border-hairline pb-2">
                  {data.dailyTrend.map((trend, idx) => {
                    const maxVal = Math.max(...data.dailyTrend.map((t) => t.count), 1);
                    const percentage = Math.round((trend.count / maxVal) * 100);
                    return (
                      <div
                        key={idx}
                        className="flex-grow bg-progress bg-[#00b9f1] hover:bg-ink transition-colors rounded-[1px] relative group cursor-pointer"
                        style={{ height: `${percentage}%`, minHeight: '4px' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-ink text-white text-[9px] font-bold py-1 px-1.5 rounded shadow-lg whitespace-nowrap z-50">
                          {trend.date}: {trend.count} apps
                        </div>
                      </div>
                    );
                  })}
                  {data.dailyTrend.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-steel text-xs font-mono">
                      No activity recorded in the last 30 days.
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-ash font-mono pt-1">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* AI Provider Intelligence */}
            {data.aiStats && (
              <div className="bg-marble border border-hairline p-6 rounded-card space-y-5">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <h3 className="font-semibold text-base text-ink tracking-tight">AI Provider Intelligence</h3>
                  <div className="flex gap-3">
                    <span className="text-[10px] font-bold font-mono bg-[#e0f7ff] text-[#0d7f8c] px-2.5 py-1 rounded-pill">
                      {data.aiStats.totalCalls} calls (30d)
                    </span>
                    <span className="text-[10px] font-bold font-mono bg-[#e7f6ed] text-[#19a05f] px-2.5 py-1 rounded-pill">
                      {data.aiStats.cacheHitRate}% cache hit
                    </span>
                    {data.aiStats.totalCost > 0 && (
                      <span className="text-[10px] font-bold font-mono bg-[#fffbeb] text-[#b45309] px-2.5 py-1 rounded-pill">
                        ${data.aiStats.totalCost.toFixed(4)} cost
                      </span>
                    )}
                  </div>
                </div>

                {data.aiStats.providerStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-hairline text-ash uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 font-bold">Provider</th>
                          <th className="py-2.5 font-bold text-center">Calls</th>
                          <th className="py-2.5 font-bold text-center">Success</th>
                          <th className="py-2.5 font-bold text-center">Avg Latency</th>
                          <th className="py-2.5 font-bold text-center">Cache Hits</th>
                          <th className="py-2.5 font-bold text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {data.aiStats.providerStats.map((stat, idx) => (
                          <tr key={idx} className="hover:bg-drafting-gray/20">
                            <td className="py-3">
                              <span className="font-bold text-ink capitalize">{stat.provider}</span>
                            </td>
                            <td className="py-3 text-center text-steel">{stat.calls}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-pill font-bold ${
                                stat.successRate >= 90 ? 'bg-[#e7f6ed] text-[#19a05f]' :
                                stat.successRate >= 70 ? 'bg-[#fffbeb] text-[#b45309]' :
                                'bg-[#feebeb] text-[#d64545]'
                              }`}>
                                {stat.successRate}%
                              </span>
                            </td>
                            <td className="py-3 text-center text-steel">
                              {stat.avgLatencyMs < 1000
                                ? `${stat.avgLatencyMs}ms`
                                : `${(stat.avgLatencyMs / 1000).toFixed(1)}s`}
                            </td>
                            <td className="py-3 text-center text-[#0d7f8c] font-semibold">{stat.cacheHits}</td>
                            <td className="py-3 text-right text-ash">${stat.totalCost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-steel text-center py-8">No AI execution logs in the last 30 days. Run the pipeline to generate data.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean clinical footer */}
      <footer className="bg-marble border-t border-hairline py-8 mt-12 text-center text-xs text-ash">
        <p>&copy; {new Date().getFullYear()} AutoApply. Clinical Console v1.0.0</p>
      </footer>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthProvider>
      <AnalyticsDashboard />
    </AuthProvider>
  );
}
