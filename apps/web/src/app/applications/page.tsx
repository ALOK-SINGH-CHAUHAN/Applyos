'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';

interface Job {
  id: string;
  company: string;
  title: string;
  sourceUrl: string;
  sourcePlatform: string;
  location?: string | null;
}

interface ResumeVersion {
  id: string;
  atsScore?: number | null;
  groundingStatus?: string | null;
  diffJson?: Record<string, any> | null;
  contentJson: any;
  resume: {
    title: string;
  };
}

interface BrowserSession {
  id: string;
  status: string;
  screenshotsJson?: string[] | null;
  logJson?: string[] | null;
  lastError?: string | null;
}

interface Application {
  id: string;
  status: string; // 'QUEUED' | 'GENERATING' | 'READY_FOR_REVIEW' | 'SUBMITTING' | 'SUBMITTED' | 'NEEDS_MANUAL_ACTION' | 'REJECTED' | 'FAILED' | etc.
  pluginUsed?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  job: Job;
  resumeVersion: ResumeVersion;
  coverLetter?: {
    id: string;
    content: string;
    tonePreset: string;
  } | null;
  browserSession?: BrowserSession | null;
}

interface ApplicationCardProps {
  app: Application;
  onClick: () => void;
  authHeaders: () => any;
  onRefresh: () => void;
}

function ApplicationCard({ app, onClick, authHeaders, onRefresh }: ApplicationCardProps) {
  const [progress, setProgress] = useState<{
    percent: number;
    step: string;
    provider?: string;
    cached?: boolean;
    retryCount?: number;
    estTimeRemaining?: string;
  } | null>(null);
  const [jobState, setJobState] = useState<string>('');
  const [failedReason, setFailedReason] = useState<string>('');

  const isProcessing =
    app.status === 'QUEUED' ||
    app.status === 'GENERATING' ||
    app.status === 'SUBMITTING';

  useEffect(() => {
    if (!isProcessing) return;

    let isActive = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/applications/${app.id}/progress`, {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isActive) return;

        setJobState(data.status);
        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.failedReason) {
          setFailedReason(data.failedReason);
        }

        // If completed or failed in BullMQ, trigger refresh of the board
        if (data.status === 'completed' || data.status === 'failed') {
          onRefresh();
        }
      } catch (e) {
        console.error(e);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [app.id, isProcessing, onRefresh]);

  const getBorderClass = () => {
    if (app.status === 'NEEDS_MANUAL_ACTION') return 'border-[#d64545]/60';
    if (app.status === 'READY_FOR_REVIEW') return 'border-[#f5a623]/60';
    return 'border-hairline';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-marble border p-4 rounded-panel shadow-sm hover:border-steel cursor-pointer transition-colors space-y-2 ${getBorderClass()}`}
    >
      <h4 className="font-semibold text-xs text-ink truncate">{app.job.title}</h4>
      <p className="text-[10px] text-steel font-medium truncate">{app.job.company}</p>

      {isProcessing && progress ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[9px] font-mono font-bold text-steel">
            <span>{progress.step || 'Processing...'}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00b9f1] h-1.5 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-ash pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00b9f1] animate-pulse" />
              {progress.provider ? (
                <span className="bg-gray-100 px-1 py-0.2 rounded font-bold text-[7px] text-steel border border-gray-200">
                  {progress.cached ? '⚡ Cache Hit' : `🤖 ${progress.provider}`}
                </span>
              ) : 'Active'}
            </span>
            {progress.estTimeRemaining && (
              <span>Est: {progress.estTimeRemaining}</span>
            )}
          </div>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center gap-1.5 pt-1.5 text-[9px] font-bold text-[#00b9f1] font-mono animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00b9f1]" />
          QUEUEING...
        </div>
      ) : jobState === 'failed' || app.status === 'FAILED' ? (
        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#d64545] font-mono">
            ⚠️ PIPELINE FAILED
          </div>
          {failedReason && (
            <p className="text-[8px] text-red-600 truncate italic font-mono">{failedReason}</p>
          )}
        </div>
      ) : app.status === 'READY_FOR_REVIEW' ? (
        <div className="flex items-center justify-between text-[9px] font-mono pt-1.5">
          <span className="font-bold text-[#f5a623] uppercase">READY FOR REVIEW</span>
          <span className="text-[#0d7f8c] font-semibold">{app.resumeVersion.atsScore}% ATS</span>
        </div>
      ) : app.status === 'SUBMITTING' ? (
        <div className="flex items-center gap-1.5 pt-1.5 text-[9px] font-bold text-[#00b9f1] font-mono animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00b9f1]" />
          SUBMITTING...
        </div>
      ) : app.status === 'SUBMITTED' ? (
        <div className="flex items-center justify-between text-[9px] font-mono pt-1.5">
          <span className="font-bold text-[#19a05f] uppercase">SUBMITTED</span>
          <span className="text-ash font-medium">
            {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : ''}
          </span>
        </div>
      ) : app.status === 'NEEDS_MANUAL_ACTION' ? (
        <div className="flex items-center gap-1.5 pt-1.5 text-[9px] font-bold text-[#d64545] font-mono">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>ACTION REQUIRED</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[9px] font-mono pt-1.5">
          <span className="font-bold text-ash uppercase">{app.status}</span>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const { authHeaders, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editedCL, setEditedCL] = useState('');
  const [isSavingCL, setIsSavingCL] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/v1/applications', { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);

        // Keep selectedApp updated with the latest parsed database state
        if (selectedApp) {
          const updated = data.find((a: Application) => a.id === selectedApp.id);
          if (updated) {
            setSelectedApp(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Poll for active/processing application states every 3 seconds
  useEffect(() => {
    const hasActive = applications.some(
      (a) =>
        a.status === 'QUEUED' ||
        a.status === 'GENERATING' ||
        a.status === 'SUBMITTING' ||
        (a.browserSession && a.browserSession.status === 'RUNNING')
    );
    if (hasActive) {
      const interval = setInterval(fetchApplications, 3000);
      return () => clearInterval(interval);
    }
  }, [applications, selectedApp]);

  const handleSelectApp = (app: Application) => {
    setSelectedApp(app);
    setEditedCL(app.coverLetter?.content || '');
  };

  const handleSaveCoverLetter = async (appId: string) => {
    setIsSavingCL(true);
    try {
      const response = await fetch(`/api/v1/applications/${appId}/cover-letter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ content: editedCL }),
      });

      if (response.ok) {
        await fetchApplications();
        alert('Cover letter updated successfully.');
      } else {
        alert('Failed to save cover letter changes.');
      }
    } catch (err) {
      console.error('Error saving cover letter:', err);
    } finally {
      setIsSavingCL(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchApplications();
      } else {
        alert('Failed to update application status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleApproveAndSubmit = async (appId: string) => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/v1/applications/${appId}/approve`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (response.ok) {
        await fetchApplications();
      } else {
        alert('Failed to approve and start submission.');
      }
    } catch (err) {
      console.error('Error approving application:', err);
    } finally {
      setIsApproving(false);
    }
  };

  // Group applications into columns for the Kanban board
  const getColumnApps = (statusGroup: string) => {
    return applications.filter((app) => {
      const s = app.status;
      switch (statusGroup) {
        case 'tailoring':
          return s === 'QUEUED' || s === 'GENERATING';
        case 'review':
          return s === 'READY_FOR_REVIEW';
        case 'submitting':
          return s === 'SUBMITTING';
        case 'submitted':
          return s === 'SUBMITTED';
        case 'action':
          return s === 'NEEDS_MANUAL_ACTION';
        case 'closed':
          return s === 'REJECTED' || s === 'FAILED' || s === 'INTERVIEW' || s === 'OFFER' || s === 'WITHDRAWN';
        default:
          return false;
      }
    });
  };

  return (
    <AuthProvider>
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

      <AppHeader />

      {/* Main Console Workspace */}
      <main className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
            Application Pipeline
          </h1>
          <p className="text-steel text-sm mt-2">
            Monitor auto-tailoring pipelines, audit grounding changes, and inspect live browser sessions.
          </p>
        </div>

        {/* Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start select-none flex-grow">
          
          {/* Column 1: Tailoring */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">1 &middot; Tailoring</span>
              <span className="text-[10px] font-bold text-ash font-mono bg-marble px-2 py-0.5 rounded-pill border border-hairline">
                {getColumnApps('tailoring').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('tailoring').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Review Gate */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">2 &middot; Review</span>
              <span className="text-[10px] font-bold text-[#f5a623] font-mono bg-[#fffbeb] px-2 py-0.5 rounded-pill border border-[#f5a623]/25">
                {getColumnApps('review').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('review').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

          {/* Column 3: Submitting */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">3 &middot; Submit</span>
              <span className="text-[10px] font-bold text-[#00b9f1] font-mono bg-[#e0f7ff] px-2 py-0.5 rounded-pill border border-[#00b9f1]/25">
                {getColumnApps('submitting').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('submitting').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

          {/* Column 4: Submitted */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">4 &middot; Done</span>
              <span className="text-[10px] font-bold text-[#19a05f] font-mono bg-[#e7f6ed] px-2 py-0.5 rounded-pill border border-[#19a05f]/25">
                {getColumnApps('submitted').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('submitted').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

          {/* Column 5: Action Required */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">5 &middot; Action</span>
              <span className="text-[10px] font-bold text-[#d64545] font-mono bg-[#feebeb] px-2 py-0.5 rounded-pill border border-[#d64545]/25">
                {getColumnApps('action').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('action').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

          {/* Column 6: Closed */}
          <div className="bg-[#eaeaea]/50 border border-hairline rounded-card p-3 space-y-3 min-h-[500px]">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-steel font-mono uppercase">6 &middot; Closed</span>
              <span className="text-[10px] font-bold text-ash font-mono bg-marble px-2 py-0.5 rounded-pill border border-hairline">
                {getColumnApps('closed').length}
              </span>
            </div>
            <div className="space-y-2">
              {getColumnApps('closed').map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onClick={() => handleSelectApp(app)}
                  authHeaders={authHeaders}
                  onRefresh={fetchApplications}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Right Detail View Drawer */}
        {selectedApp && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[650px] bg-marble border-l border-hairline shadow-2xl z-50 flex flex-col select-text">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-hairline flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono text-steel uppercase bg-drafting-gray px-2.5 py-0.5 rounded-pill border border-hairline">
                    {selectedApp.job.sourcePlatform} Adapter
                  </span>
                  
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleUpdateStatus(selectedApp.id, e.target.value)}
                    className="text-[10px] font-bold font-mono border border-hairline rounded bg-marble px-2 py-0.5 focus:outline-none cursor-pointer text-ink"
                  >
                    <option value="QUEUED">QUEUED</option>
                    <option value="GENERATING">GENERATING</option>
                    <option value="READY_FOR_REVIEW">READY FOR REVIEW</option>
                    <option value="SUBMITTING">SUBMITTING</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="NEEDS_MANUAL_ACTION">NEEDS MANUAL ACTION</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                
                <h2 className="text-lg font-bold text-ink truncate mt-2" title={selectedApp.job.title}>
                  {selectedApp.job.title}
                </h2>
                <p className="text-xs text-steel font-semibold truncate mt-0.5">
                  {selectedApp.job.company} &middot; {selectedApp.job.location || 'Remote'}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-steel hover:text-ink p-1 border border-hairline rounded-button bg-drafting-gray/20"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body Scrollport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* STATUS SPECIFIC VIEWS */}

              {/* A. Review Gate */}
              {selectedApp.status === 'READY_FOR_REVIEW' && (
                <div className="space-y-8">
                  {/* Grounded Diff Validator Summary */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                      Grounded Policy Verification
                    </h3>
                    
                    {/* Compliance Indicator */}
                    <div className={`p-4 rounded-panel border flex items-center gap-3 ${
                      selectedApp.resumeVersion.groundingStatus === 'PASSED'
                        ? 'bg-[#e7f6ed] border-[#19a05f]/30 text-[#19a05f]'
                        : 'bg-[#fffbeb] border-[#f5a623]/30 text-[#f5a623]'
                    }`}>
                      {selectedApp.resumeVersion.groundingStatus === 'PASSED' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <div>
                            <p className="text-xs font-bold text-ink">Grounded Verification: PASSED</p>
                            <p className="text-[10px] text-steel mt-0.5">100% of resume claims are verified against primary experience facts.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                          </svg>
                          <div>
                            <p className="text-xs font-bold text-ink">Grounded Verification: SELF-CORRECTED</p>
                            <p className="text-[10px] text-steel mt-0.5">Fabricated qualifications were flagged and reverted back to original truths.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Diff lists if any */}
                    {selectedApp.resumeVersion.diffJson && Object.keys(selectedApp.resumeVersion.diffJson).length > 0 && (
                      <div className="border border-hairline rounded-panel overflow-hidden font-mono text-[10px]">
                        <div className="bg-drafting-gray p-2 border-b border-hairline font-semibold text-ink">
                          Validator Corrections log
                        </div>
                        <div className="p-3 space-y-2 bg-marble">
                          {Object.entries(selectedApp.resumeVersion.diffJson).map(([key, diff]: [string, any]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-ash font-bold">{key.replace('_', ' ')}</p>
                              <p className="text-[#d64545] bg-[#feebeb] px-1.5 py-0.5 rounded-[3px] line-through">
                                - {diff.tailoredAttempt}
                              </p>
                              <p className="text-[#19a05f] bg-[#e7f6ed] px-1.5 py-0.5 rounded-[3px]">
                                + {diff.revertedTo}
                              </p>
                              <p className="text-[9px] text-ash italic">Reason: {diff.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tailored Experience Preview */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                      Tailored Resume Details
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto border border-hairline p-4 rounded-panel bg-drafting-gray/25">
                      {selectedApp.resumeVersion.contentJson.experience?.map((exp: any, idx: number) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <p className="font-bold text-ink">{exp.title} &middot; <span className="text-steel font-medium">{exp.company}</span></p>
                          <ul className="list-disc pl-4 text-steel space-y-0.5 mt-1">
                            {exp.highlights.map((h: string, hIdx: number) => (
                              <li key={hIdx} className="leading-relaxed">{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cover Letter Editor */}
                  {selectedApp.coverLetter && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                          Tailored Cover Letter
                        </h3>
                        
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-steel font-mono">Tone:</span>
                          <select
                            value={selectedApp.coverLetter.tonePreset || 'PROFESSIONAL'}
                            onChange={(e) => {
                              alert(`Tone preset updated to ${e.target.value}. Custom presets affect subsequent AI generation iterations.`);
                            }}
                            className="border border-hairline rounded bg-marble px-1.5 py-0.5 focus:outline-none font-mono font-semibold text-ink"
                          >
                            <option value="PROFESSIONAL">PROFESSIONAL</option>
                            <option value="CASUAL">CASUAL</option>
                            <option value="CREATIVE">CREATIVE</option>
                            <option value="ACADEMIC">ACADEMIC</option>
                            <option value="ENTHUSIASTIC">ENTHUSIASTIC</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        value={editedCL}
                        onChange={(e) => setEditedCL(e.target.value)}
                        className="w-full h-64 bg-drafting-gray/25 border border-hairline rounded-panel p-4 text-xs font-mono focus:outline-none focus:border-steel leading-relaxed"
                      />
                      <button
                        onClick={() => handleSaveCoverLetter(selectedApp.id)}
                        disabled={isSavingCL}
                        className="px-4 py-2 border border-hairline text-ink rounded-button text-xs font-semibold hover:bg-drafting-gray transition disabled:opacity-50"
                      >
                        {isSavingCL ? 'Saving changes...' : 'Save cover letter changes'}
                      </button>
                    </div>
                  )}

                  {/* Submission Approve CTA */}
                  <div className="border-t border-hairline pt-6">
                    <button
                      onClick={() => handleApproveAndSubmit(selectedApp.id)}
                      disabled={isApproving}
                      className="w-full py-3 bg-ink text-marble hover:bg-opacity-90 rounded-button text-sm font-semibold shadow-lg transition disabled:opacity-50"
                    >
                      {isApproving ? 'Submitting Application...' : 'Approve & Submit application'}
                    </button>
                  </div>
                </div>
              )}

              {/* B. Browser Session logs & screenshots (Automating / Completed) */}
              {(selectedApp.status === 'SUBMITTING' ||
                selectedApp.status === 'SUBMITTED' ||
                selectedApp.status === 'NEEDS_MANUAL_ACTION' ||
                selectedApp.status === 'FAILED') && (
                <div className="space-y-8">
                  
                  {/* Status Indicator */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                      Submission Automation Status
                    </h3>
                    <div className={`p-4 rounded-panel border flex justify-between items-center ${
                      selectedApp.status === 'SUBMITTED' ? 'bg-[#e7f6ed] border-[#19a05f]/30 text-[#19a05f]' :
                      selectedApp.status === 'NEEDS_MANUAL_ACTION' ? 'bg-[#fffbeb] border-[#f5a623]/30 text-[#f5a623]' :
                      selectedApp.status === 'SUBMITTING' ? 'bg-[#e0f7ff] border-[#00b9f1]/30 text-[#00b9f1]' :
                      'bg-[#feebeb] border-[#d64545]/30 text-[#d64545]'
                    }`}>
                      <span className="text-xs font-bold font-mono tracking-wide">
                        STATE: {selectedApp.status}
                      </span>
                      {selectedApp.status === 'SUBMITTING' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00b9f1] animate-ping" />
                      )}
                    </div>
                  </div>

                  {/* Screenshots Grid */}
                  {selectedApp.browserSession?.screenshotsJson && selectedApp.browserSession.screenshotsJson.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                        Page State Screenshots
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedApp.browserSession.screenshotsJson.map((src, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setZoomedImage(src)}
                            className="aspect-[4/3] border border-hairline rounded-panel overflow-hidden cursor-pointer hover:border-steel transition relative group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={src} 
                              alt={`Step ${idx + 1} screenshot`}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-mono bg-black/40">
                              Expand view
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Browser session logs timeline */}
                  {selectedApp.browserSession?.logJson && selectedApp.browserSession.logJson.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-xs text-ash uppercase tracking-wider font-mono">
                        Browser Automation Logs
                      </h3>
                      <div className="border border-hairline rounded-panel p-4 bg-drafting-gray/30 max-h-[300px] overflow-y-auto space-y-2 font-mono text-[10px] text-steel">
                        {selectedApp.browserSession.logJson.map((log, idx) => (
                          <div key={idx} className="leading-relaxed">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automation error alerts */}
                  {selectedApp.browserSession?.lastError && (
                    <div className="p-4 rounded-panel bg-[#feebeb] border border-[#d64545]/20 text-[#d64545] space-y-1">
                      <p className="text-xs font-bold font-mono">Last session error log:</p>
                      <p className="text-xs leading-relaxed font-mono">{selectedApp.browserSession.lastError}</p>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-hairline bg-drafting-gray/10 text-center text-xs text-ash font-mono select-none">
              Application ID: {selectedApp.id}
            </div>

          </div>
        )}

        {/* Modal for expanding state screenshots */}
        {zoomedImage && (
          <div 
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-[100] flex items-center justify-center p-6 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[85vh] bg-marble rounded-card overflow-hidden border border-hairline p-1 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={zoomedImage} 
                alt="Expanded step screenshot"
                className="max-w-full max-h-[80vh] object-contain rounded-panel"
              />
              <p className="text-center font-mono text-[10px] text-ash mt-2 select-all">{zoomedImage}</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-marble border-t border-hairline py-8 mt-12 text-center text-xs text-ash">
        <p>&copy; {new Date().getFullYear()} AutoApply. Clinical Console v1.0.0</p>
      </footer>
    </div>
    </AuthProvider>
  );
}
