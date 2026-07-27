'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';

interface AIExecution {
  id: string;
  feature: string;
  provider: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheStatus: 'HIT' | 'MISS' | string;
  promptHash: string;
  responseHash?: string;
  httpStatus: number;
  cost: string | number;
  promptText: string;
  responseText?: string;
  errorText?: string;
  createdAt: string;
}

interface VerificationFeature {
  status: 'SUCCESS' | 'NOT_RUN_YET' | string;
  usedRealLLM: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  httpStatus?: number;
  timestamp?: string;
  tokens?: number;
  cost?: number;
  cacheStatus?: string;
  message?: string;
}

export default function AiObservabilityDashboard() {
  const { authHeaders, user } = useAuth();
  const [executions, setExecutions] = useState<AIExecution[]>([]);
  const [report, setReport] = useState<Record<string, VerificationFeature>>({});
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cache test state
  const [testingCache, setTestingCache] = useState(false);
  const [cacheTestData, setCacheTestData] = useState<any | null>(null);

  const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN';

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/v1/ai-observability/executions?limit=50', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching executions:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/v1/ai-observability/report', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching verification report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const runCacheTest = async () => {
    setTestingCache(true);
    setCacheTestData(null);
    try {
      const res = await fetch('/api/v1/ai-observability/test-cache-compare', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCacheTestData(data);
        // Refresh logs and verification report to show the new test run
        fetchExecutions();
        fetchReport();
      }
    } catch (err) {
      console.error('Error running cache test:', err);
    } finally {
      setTestingCache(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchExecutions();
      fetchReport();
    }
  }, [user, isAdmin]);

  const getFeatureBadge = (feature: string) => {
    const map: Record<string, string> = {
      RESUME_PARSE: 'bg-[#e6f8f5] text-[#0d7f8c] border-[#bfece5]',
      RESUME_ANALYSIS: 'bg-blue-50 text-blue-700 border-blue-200',
      JOB_ANALYSIS: 'bg-purple-50 text-purple-700 border-purple-200',
      COMPARISON: 'bg-amber-50 text-amber-700 border-amber-200',
      TAILORING: 'bg-pink-50 text-pink-700 border-pink-200',
      COVER_LETTER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return map[feature] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-drafting-gray text-ink font-sans antialiased flex flex-col">
      <AppHeader />

      <main className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
              AI Observability & Debug Console
            </h1>
            <p className="text-steel text-sm mt-2">
              Track LLM latency, token counts, costs, and cache statuses. Verify provider grounding factual integrity.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLoadingLogs(true);
                setLoadingReport(true);
                fetchExecutions();
                fetchReport();
              }}
              className="px-4 py-2 border border-hairline bg-marble rounded-button text-xs font-semibold hover:bg-drafting-gray transition-colors shadow-sm"
            >
              Refresh Logs
            </button>
          </div>
        </div>

        {!isAdmin ? (
          <div className="py-20 text-center bg-marble border border-hairline rounded-card max-w-xl mx-auto w-full space-y-4 shadow-lg">
            <svg className="w-12 h-12 text-error mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-ink">Developer Privileges Required</h2>
            <p className="text-sm text-steel max-w-sm mx-auto">
              You possess {user.role} privileges. Only administrators and owners are permitted to access secure execution telemetry logs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT AREA: Telemetry Logs Table */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Telemetry Logs Container */}
              <div className="bg-marble border border-hairline rounded-card shadow-sm overflow-hidden">
                <div className="p-5 border-b border-hairline bg-marble flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">AI Execution Telemetry Log</h3>
                  <span className="text-[10px] text-steel font-mono">Last 50 queries</span>
                </div>
                
                {loadingLogs ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-steel font-mono">Loading telemetry database...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-hairline text-ash uppercase tracking-wider bg-drafting-gray/10">
                          <th className="py-3 px-5 font-bold">Time / Feature</th>
                          <th className="py-3 px-5 font-bold">Provider / Model</th>
                          <th className="py-3 px-5 font-bold text-center">Cache</th>
                          <th className="py-3 px-5 font-bold text-right">Stats</th>
                          <th className="py-3 px-5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {executions.map((exec) => {
                          const isExpanded = expandedId === exec.id;
                          return (
                            <React.Fragment key={exec.id}>
                              <tr className="hover:bg-drafting-gray/10 transition-colors">
                                <td className="py-4 px-5">
                                  <div className="text-[10px] text-steel">
                                    {new Date(exec.createdAt).toLocaleTimeString()}
                                  </div>
                                  <span className={`inline-block border px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 uppercase ${getFeatureBadge(exec.feature)}`}>
                                    {exec.feature}
                                  </span>
                                </td>
                                <td className="py-4 px-5">
                                  <div className="font-semibold text-ink capitalize">{exec.provider}</div>
                                  <div className="text-[9px] text-steel font-mono">{exec.model}</div>
                                </td>
                                <td className="py-4 px-5 text-center">
                                  {exec.cacheStatus === 'HIT' ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      HIT ⚡
                                    </span>
                                  ) : (
                                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      MISS
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-5 text-right font-mono">
                                  <div className="text-ink">{exec.latencyMs}ms</div>
                                  <div className="text-[9px] text-steel">
                                    {exec.totalTokens} t · ${Number(exec.cost).toFixed(5)}
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-right">
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                                    className="text-progress font-semibold hover:underline text-xs"
                                  >
                                    {isExpanded ? 'Hide Payload' : 'View Payload'}
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Expand Panel: Prompt and Response Raw Inspect */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} className="bg-drafting-gray/20 p-5 border-t border-hairline">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-steel mb-1.5">Prompt Payload</div>
                                        <pre className="text-[10px] text-steel font-mono overflow-x-auto whitespace-pre-wrap max-w-[700px] bg-marble p-4 border border-hairline rounded-panel">
                                          {(() => {
                                            try {
                                              return JSON.stringify(JSON.parse(exec.promptText), null, 2);
                                            } catch {
                                              return exec.promptText;
                                            }
                                          })()}
                                        </pre>
                                      </div>

                                      {exec.responseText && (
                                        <div>
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-steel mb-1.5">Model Response</div>
                                          <pre className="text-[10px] text-emerald-800 font-mono overflow-x-auto whitespace-pre-wrap max-w-[700px] bg-marble p-4 border border-hairline rounded-panel">
                                            {(() => {
                                              try {
                                                return JSON.stringify(JSON.parse(exec.responseText), null, 2);
                                              } catch {
                                                return exec.responseText;
                                              }
                                            })()}
                                          </pre>
                                        </div>
                                      )}

                                      {exec.errorText && (
                                        <div>
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-error mb-1.5">Execution Failure Details</div>
                                          <pre className="text-[10px] text-error font-mono overflow-x-auto whitespace-pre-wrap max-w-[700px] bg-red-50 p-4 border border-red-200 rounded-panel">
                                            {exec.errorText}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        
                        {executions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-steel">
                              No executions recorded. Run a resume analysis or tailoring job to generate observability logs.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT AREA: Verification Report & Cache Tester */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Active LLM Verification Report */}
              <div className="bg-marble border border-hairline rounded-card shadow-sm p-6 space-y-6">
                <div className="border-b border-hairline pb-4">
                  <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Active LLM Verification</h3>
                  <p className="text-xs text-steel mt-1">Audit status proving real model usage instead of mocks.</p>
                </div>
                
                {loadingReport ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-6 h-6 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] text-steel font-mono">Running LLM integrity audit...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(report).map(([feature, data]) => {
                      const isReal = data.usedRealLLM;
                      const hasRun = data.status === 'SUCCESS';
                      
                      return (
                        <div key={feature} className="p-3 border border-hairline rounded-panel bg-drafting-gray/10 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-bold text-ink uppercase tracking-tight">{feature.replace('_', ' ')}</div>
                            {hasRun ? (
                              <div className="text-[9px] text-steel font-mono mt-0.5">
                                {data.provider} · {data.model}
                              </div>
                            ) : (
                              <div className="text-[9px] text-ash font-mono mt-0.5">Not run in this session</div>
                            )}
                          </div>
                          <div>
                            {!hasRun ? (
                              <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                UNTESTED
                              </span>
                            ) : isReal ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                LLM VERIFIED
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                MOCKED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cache Latency Tester Widget */}
              <div className="bg-marble border border-hairline rounded-card shadow-sm p-6 space-y-6">
                <div className="border-b border-hairline pb-4">
                  <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Cache Latency Tester</h3>
                  <p className="text-xs text-steel mt-1">Run side-by-side comparison of uncached vs cached executions.</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={runCacheTest}
                    disabled={testingCache}
                    className="w-full py-2.5 bg-ink text-marble rounded-button shadow text-xs font-semibold hover:bg-opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {testingCache ? (
                      <>
                        <div className="w-4 h-4 border-2 border-marble border-t-transparent rounded-full animate-spin"></div>
                        Measuring latency...
                      </>
                    ) : (
                      'Execute Latency Test'
                    )}
                  </button>

                  {cacheTestData && (
                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div className="text-[10px] text-steel font-mono">
                        <strong>Prompt:</strong> &quot;{cacheTestData.promptText}&quot;
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* UNCAHED PANEL */}
                        <div className="p-3 border border-hairline bg-drafting-gray/10 rounded-panel space-y-1.5 text-center">
                          <div className="text-[9px] font-bold text-ash uppercase tracking-wider">Uncached</div>
                          <div className="text-2xl font-bold text-ink tracking-tight">
                            {cacheTestData.uncached.latencyMs}ms
                          </div>
                          <div className="text-[9px] text-steel font-mono capitalize">
                            {cacheTestData.uncached.provider}
                          </div>
                          <span className="inline-block bg-gray-100 text-gray-500 border border-gray-200 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                            CACHE MISS
                          </span>
                        </div>

                        {/* CACHED PANEL */}
                        <div className="p-3 border border-emerald-100 bg-emerald-50/20 rounded-panel space-y-1.5 text-center">
                          <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Cached</div>
                          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
                            {cacheTestData.cached.latencyMs}ms
                          </div>
                          <div className="text-[9px] text-emerald-700 font-mono capitalize">
                            Database
                          </div>
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                            CACHE HIT ⚡
                          </span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/30 p-2.5 rounded border border-emerald-100 text-[10px] text-emerald-800 leading-normal text-center">
                        <strong>Cache efficiency:</strong> Reduced execution time by{' '}
                        {Math.max(
                          0,
                          Math.round(
                            ((cacheTestData.uncached.latencyMs - cacheTestData.cached.latencyMs) /
                              cacheTestData.uncached.latencyMs) *
                              100
                          )
                        )}
                        %
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <footer className="bg-marble border-t border-hairline py-8 mt-12 text-center text-xs text-ash">
        <div className="max-w-[1200px] mx-auto px-6">
          <p>© {new Date().getFullYear()} AutoApply. Secure developer workspace.</p>
        </div>
      </footer>
    </div>
  );
}
