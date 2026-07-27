'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';

interface AutomationExecution {
  id: string;
  applicationId: string;
  plugin: string;
  ats: string;
  browser: string;
  durationMs: number;
  stepsJson: Array<{ step: string; timestamp: string }>;
  screenshotsJson?: string[];
  success: boolean;
  errorText?: string;
  createdAt: string;
  application: {
    job: {
      company: string;
      title: string;
      sourceUrl: string;
    };
    resumeVersion: {
      atsScore?: number;
    };
  };
}

export default function AutomationDashboard() {
  const { authHeaders, user } = useAuth();
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN';

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/v1/automation/executions?limit=50', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching automation executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchExecutions();
    }
  }, [user, isAdmin]);

  const selectedExec = executions.find((e) => e.id === selectedId);

  const getAtsBadgeColor = (ats: string) => {
    const map: Record<string, string> = {
      greenhouse: 'bg-[#e6f8f5] text-[#0d7f8c] border-[#bfece5]',
      lever: 'bg-orange-50 text-orange-700 border-orange-200',
      ashby: 'bg-purple-50 text-purple-700 border-purple-200',
      guru: 'bg-blue-50 text-blue-700 border-blue-200',
      peopleperhour: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return map[ats.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-drafting-gray text-ink font-sans antialiased flex flex-col">
      <AppHeader />

      <main className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
              Browser Automation Console
            </h1>
            <p className="text-steel text-sm mt-2">
              Trace background submission jobs, inspect DOM step-by-step logs, and view captured screenshots.
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setLoading(true);
                fetchExecutions();
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
            <h2 className="text-lg font-semibold text-ink">Access Restrained</h2>
            <p className="text-sm text-steel max-w-sm mx-auto">
              You hold {user.role} privileges. Accessing secure browser session telemetry is restricted to Administrators and Owners.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT AREA: Automation Runs Table */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-marble border border-hairline rounded-card shadow-sm overflow-hidden">
                <div className="p-5 border-b border-hairline bg-marble flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Submission Executions</h3>
                  <span className="text-[10px] text-steel font-mono">Last 50 attempts</span>
                </div>

                {loading ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-steel font-mono">Querying automation records...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-hairline text-ash uppercase tracking-wider bg-drafting-gray/10">
                          <th className="py-3 px-5 font-bold">Target Company / Role</th>
                          <th className="py-3 px-5 font-bold">ATS Platform</th>
                          <th className="py-3 px-5 font-bold text-center">Status</th>
                          <th className="py-3 px-5 font-bold text-right">Duration</th>
                          <th className="py-3 px-5 font-bold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {executions.map((exec) => {
                          const isSelected = selectedId === exec.id;
                          return (
                            <tr
                              key={exec.id}
                              className={`hover:bg-drafting-gray/10 transition-colors cursor-pointer ${
                                isSelected ? 'bg-progress/5 border-l-4 border-l-progress' : ''
                              }`}
                              onClick={() => setSelectedId(isSelected ? null : exec.id)}
                            >
                              <td className="py-4 px-5">
                                <div className="font-semibold text-ink">
                                  {exec.application.job.company}
                                </div>
                                <div className="text-[10px] text-steel mt-0.5">
                                  {exec.application.job.title}
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`inline-block border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getAtsBadgeColor(exec.ats)}`}>
                                  {exec.ats}
                                </span>
                                <div className="text-[8px] text-steel mt-1 font-mono">{exec.browser}</div>
                              </td>
                              <td className="py-4 px-5 text-center">
                                {exec.success ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                    SUCCESS ✅
                                  </span>
                                ) : (
                                  <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                    FAILED ❌
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-5 text-right font-mono text-ink font-semibold">
                                {(exec.durationMs / 1000).toFixed(1)}s
                                <div className="text-[8px] text-steel mt-0.5">
                                  {new Date(exec.createdAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button className="text-progress font-semibold hover:underline text-xs">
                                  {isSelected ? 'Collapse' : 'Inspect'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {executions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-16 text-center text-steel">
                              No automation execution records present. Run a job submission task to log telemetry.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT AREA: Expanded Session Trace Details */}
            <div className="lg:col-span-4 space-y-8">
              {selectedExec ? (
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="bg-marble border border-hairline rounded-card shadow-sm p-6 space-y-4">
                    <div className="border-b border-hairline pb-4 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                          Run Details
                        </h4>
                        <p className="text-[10px] text-steel font-mono mt-1">
                          ID: {selectedExec.id.substring(0, 8)}...
                        </p>
                      </div>
                      <span className={`inline-block border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getAtsBadgeColor(selectedExec.ats)}`}>
                        {selectedExec.ats}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-steel block text-[9px] uppercase">Duration</span>
                        <strong className="text-ink">{(selectedExec.durationMs / 1000).toFixed(2)}s</strong>
                      </div>
                      <div>
                        <span className="text-steel block text-[9px] uppercase">Browser</span>
                        <strong className="text-ink capitalize">{selectedExec.browser.split('/')[1] || 'Chromium'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-steel block text-[9px] uppercase">Job Link</span>
                        <a
                          href={selectedExec.application.job.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-progress hover:underline truncate block"
                        >
                          {selectedExec.application.job.sourceUrl}
                        </a>
                      </div>
                    </div>

                    {!selectedExec.success && selectedExec.errorText && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-panel text-red-700 text-xs font-mono whitespace-pre-wrap">
                        <strong>Error:</strong> {selectedExec.errorText}
                      </div>
                    )}
                  </div>

                  {/* Screenshots Carousel */}
                  {selectedExec.screenshotsJson && selectedExec.screenshotsJson.length > 0 && (
                    <div className="bg-marble border border-hairline rounded-card shadow-sm p-6 space-y-4">
                      <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                        Page Screenshots
                      </h4>
                      
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-hairline">
                        {selectedExec.screenshotsJson.map((src, i) => (
                          <div key={i} className="flex-shrink-0 w-48 space-y-1">
                            <div className="border border-hairline rounded overflow-hidden bg-drafting-gray/10 relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={`Screenshot ${i + 1}`}
                                className="w-full h-28 object-cover hover:scale-105 transition-transform duration-200 cursor-zoom-in"
                                onClick={() => window.open(src, '_blank')}
                              />
                            </div>
                            <span className="text-[9px] text-steel font-mono block text-center">
                              {i === 0 ? 'Landing Page' : i === 1 ? 'Form Filled' : i === 2 ? 'Submission Confirmation' : `Screenshot ${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step Timeline */}
                  <div className="bg-marble border border-hairline rounded-card shadow-sm p-6 space-y-4">
                    <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                      Execution Steps Trace
                    </h4>

                    <div className="space-y-4 relative before:absolute before:top-1.5 before:bottom-1.5 before:left-2 before:w-0.5 before:bg-hairline">
                      {selectedExec.stepsJson.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-4 relative">
                          <div className="w-4 h-4 rounded-full bg-marble border-2 border-progress flex items-center justify-center flex-shrink-0 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-progress"></div>
                          </div>
                          <div>
                            <p className="text-xs text-ink leading-tight font-medium">
                              {step.step}
                            </p>
                            <span className="text-[9px] text-steel font-mono mt-0.5 block">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-marble border border-hairline rounded-card shadow-sm p-8 text-center text-steel">
                  Select a submission execution run from the left panel to inspect detailed logs and visual states.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
