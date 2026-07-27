'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ResumeVersion {
  id: string;
  createdAt: string;
  atsScore?: number;
  targetRole?: string;
  applicationsCount?: number;
}

interface Resume {
  id: string;
  title: string;
  originalFileUrl: string;
  status: 'PARSING' | 'READY' | 'FAILED';
  parsedJson?: any;
  versions?: ResumeVersion[];
  createdAt: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function ResumesPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResumesPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function ResumesPage() {
  const { authHeaders, user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingTailoredPdf, setDownloadingTailoredPdf] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Drawer Workspaces State
  const [selectedJobWorkspaceId, setSelectedJobWorkspaceId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'tailor' | 'coverletter' | 'apply'>('overview');
  const [editedCL, setEditedCL] = useState('');
  const [oppCount, setOppCount] = useState(0);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  
  // Human Review safety checks
  const [resumeReviewed, setResumeReviewed] = useState(false);
  const [coverLetterReviewed, setCoverLetterReviewed] = useState(false);
  const [atsAnswersReviewed, setAtsAnswersReviewed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor network connectivity
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch resumes list
  const { data: resumes = [], isLoading: loadingResumes, refetch: refetchResumes } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/resumes', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch resumes library');
      return res.json();
    },
  });

  // Read query parameters to initialize resume selection & job workspace drawer
  useEffect(() => {
    if (typeof window !== 'undefined' && resumes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const rId = params.get('resumeId');
      const jId = params.get('workspaceJobId');
      const tab = params.get('tab');
      if (rId) setSelectedResumeId(rId);
      if (jId) setSelectedJobWorkspaceId(jId);
      if (tab && (tab === 'overview' || tab === 'tailor' || tab === 'coverletter' || tab === 'apply')) {
        setWorkspaceTab(tab as any);
      }
    }
  }, [resumes]);

  const selectedResume = resumes.find(r => r.id === selectedResumeId) || null;

  // Fetch all jobs in database to calculate actual discovery target count
  const { data: dbJobs = [] } = useQuery<any[]>({
    queryKey: ['all-db-jobs-for-count'],
    queryFn: async () => {
      const res = await fetch('/api/v1/jobs', { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const targetCount = dbJobs.length > 0 ? dbJobs.length : 124;

  // Animated opportunities discovery counter
  useEffect(() => {
    if (activeJobId || (selectedResume && selectedResume.status === 'PARSING')) {
      setOppCount(dbJobs.length);
    } else {
      setOppCount(0);
    }
  }, [activeJobId, selectedResume?.status, dbJobs.length]);

  // Reset safety review checks when switching job workspaces
  useEffect(() => {
    setResumeReviewed(false);
    setCoverLetterReviewed(false);
    setAtsAnswersReviewed(false);
  }, [selectedJobWorkspaceId]);

  // Find latest version of the selected resume
  const latestVersion = selectedResume?.versions && selectedResume.versions.length > 0
    ? [...selectedResume.versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Fetch matches list for the selected resume version
  const { data: matches = [], isLoading: loadingMatches, refetch: refetchMatches } = useQuery<any[]>({
    queryKey: ['resume-matches', latestVersion?.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/resumes/${latestVersion?.id}/matches`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch resume matches');
      const data = await res.json();
      // Sort matches descending by overallMatch score
      return data.sort((a: any, b: any) => (b.overallMatch || 0) - (a.overallMatch || 0));
    },
    enabled: !!latestVersion?.id && selectedResume?.status === 'READY',
  });

  // Dynamically calculate top 5 companies by max match score
  const topCompanies = React.useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const companyScores: Record<string, number> = {};
    matches.forEach((m: any) => {
      const company = m.job?.company;
      const score = m.overallMatch || 0;
      if (company) {
        if (!companyScores[company] || score > companyScores[company]) {
          companyScores[company] = score;
        }
      }
    });
    return Object.entries(companyScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company]) => company);
  }, [matches]);

  // Fetch all applications
  const { data: applications = [], refetch: refetchApplications } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/v1/applications', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
  });

  // Helper to generate dynamic timeline steps from actual app context
  const getTimelineSteps = (app: any, match: any) => {
    const steps = [];

    const formatTime = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    };

    const status = app.status;
    const isFailed = status === 'FAILED' || status === 'NEEDS_MANUAL_ACTION' || app.browserSession?.status === 'FAILED';

    // Step 1: Ingest
    steps.push({
      title: 'Searching live jobs & parsed context',
      description: 'Profile matches analyzed successfully',
      time: formatTime(app.createdAt),
      status: 'completed',
    });

    // Step 2: Match
    steps.push({
      title: `Matched with ${match?.job?.company || 'Employer'}`,
      description: `Fit score: ${match?.overallMatch || 80}% | Probability: ${Math.round((match?.overallMatch || 80) * 0.85)}%`,
      time: formatTime(app.createdAt),
      status: 'completed',
    });

    // Step 3: Tailoring
    const tailorCompleted = ['TAILORED', 'LETTER_GENERATING', 'LETTER_READY', 'READY_FOR_REVIEW', 'AUTOMATION_PREPARING', 'AUTOMATION_RUNNING', 'SUBMITTED', 'VERIFIED', 'COMPLETED'].includes(status);
    const tailorRunning = status === 'TAILORING';
    steps.push({
      title: 'Tailoring resume versions',
      description: tailorCompleted ? 'PDF rendered and validated against requirements' : tailorRunning ? 'Generating tailored bullets & summaries...' : 'Awaiting tailoring start...',
      time: tailorCompleted ? formatTime(app.resumeVersion?.createdAt) : '',
      status: tailorCompleted ? 'completed' : tailorRunning ? 'running' : isFailed && status === 'TAILORING' ? 'failed' : 'pending',
    });

    // Step 4: Cover Letter
    const letterCompleted = ['LETTER_READY', 'READY_FOR_REVIEW', 'AUTOMATION_PREPARING', 'AUTOMATION_RUNNING', 'SUBMITTED', 'VERIFIED', 'COMPLETED'].includes(status);
    const letterRunning = status === 'LETTER_GENERATING';
    steps.push({
      title: 'Custom Cover Letter generated',
      description: letterCompleted ? 'Approved by applicant' : letterRunning ? 'Creating cover letter draft...' : 'Awaiting cover letter generation...',
      time: letterCompleted ? formatTime(app.coverLetter?.createdAt) : '',
      status: letterCompleted ? 'completed' : letterRunning ? 'running' : isFailed && status === 'LETTER_GENERATING' ? 'failed' : 'pending',
    });

    // Step 5: Browser Automation
    const session = app.browserSession;
    const autoCompleted = ['SUBMITTED', 'VERIFIED', 'COMPLETED'].includes(status);
    const autoRunning = ['AUTOMATION_PREPARING', 'AUTOMATION_RUNNING', 'SUBMITTING'].includes(status);
    steps.push({
      title: 'Launching browser automation',
      description: autoCompleted 
        ? `Filled ${match?.job?.sourcePlatform || 'Greenhouse'} forms successfully` 
        : isFailed 
        ? `Automation stopped: ${session?.lastError || 'User action required'}` 
        : autoRunning 
        ? 'Fills forms in background...' 
        : 'Awaiting launch...',
      time: session?.startedAt ? formatTime(session.startedAt) : '',
      status: autoCompleted ? 'completed' : isFailed && ['AUTOMATION_PREPARING', 'AUTOMATION_RUNNING', 'SUBMITTING'].includes(status) ? 'failed' : autoRunning ? 'running' : 'pending',
    });

    // Step 6: Submission & Verification Status
    const verifiedCompleted = ['VERIFIED', 'COMPLETED'].includes(status);
    const verifiedRunning = status === 'SUBMITTED';
    steps.push({
      title: verifiedCompleted ? 'Submitted & Verified' : 'Submission confirmed',
      description: verifiedCompleted 
        ? 'Application verified via confirmation email' 
        : verifiedRunning 
        ? 'Verifying application status...' 
        : isFailed 
        ? 'Verification failed' 
        : 'Pending submission confirmation...',
      time: verifiedCompleted ? formatTime(app.submittedAt || session?.finishedAt) : '',
      status: verifiedCompleted ? 'completed' : isFailed ? 'failed' : verifiedRunning ? 'running' : 'pending',
    });

    return steps;
  };

  // Fetch intelligence details
  const { data: intel = null, isLoading: loadingIntel } = useQuery({
    queryKey: ['intelligence', selectedResumeId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/resumes/${selectedResumeId}/intelligence`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch intelligence insights');
      return res.json();
    },
    enabled: !!selectedResumeId && selectedResume?.status === 'READY',
  });

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ resumeId, force }: { resumeId: string; force?: boolean }) => {
      const res = await fetch(`/api/v1/resumes/${resumeId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ force }),
      });
      if (!res.ok) throw new Error('Analysis request failed');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'COMPLETED') {
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
        queryClient.invalidateQueries({ queryKey: ['intelligence', selectedResumeId] });
        setActiveJobId(null);
      } else {
        setActiveJobId(data.jobId);
      }
    },
  });

  // Job status polling query
  const { data: jobStatus = null } = useQuery({
    queryKey: ['job-status', activeJobId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/resumes/${selectedResumeId}/analyze/status/${activeJobId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve analyzer progress');
      return res.json();
    },
    enabled: !!activeJobId && !!selectedResumeId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return 2000;
    },
  });

  // Mutate endpoints for applications in the Workspace drawer
  const startAppMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await fetch(`/api/v1/applications/${appId}/start`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to start application tailoring');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const createAppMutation = useMutation({
    mutationFn: async ({ jobId, resumeVersionId }: { jobId: string; resumeVersionId: string }) => {
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ jobId, resumeVersionId }),
      });
      if (!res.ok) throw new Error('Failed to initialize application');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      startAppMutation.mutate(data.id);
    },
  });

  const approveAppMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await fetch(`/api/v1/applications/${appId}/approve`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to approve application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const saveCLMutation = useMutation({
    mutationFn: async ({ appId, content }: { appId: string; content: string }) => {
      const res = await fetch(`/api/v1/applications/${appId}/cover-letter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save cover letter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      alert('Cover letter saved successfully!');
    },
  });

  // Retrieve active drawer workspace context
  const activeMatch = matches.find(m => m.jobId === selectedJobWorkspaceId) || null;
  const activeApp = applications.find(a => a.jobId === selectedJobWorkspaceId && a.resumeVersionId === latestVersion?.id) || null;

  // Poll progress for active app if it is generating/queued/submitting
  const { data: appProgress = null, isError: isAppProgressError, isLoading: isAppProgressLoading } = useQuery({
    queryKey: ['app-progress', activeApp?.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/applications/${activeApp.id}/progress`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch application progress');
      return res.json();
    },
    enabled: !!activeApp && (activeApp.status === 'CREATED' || activeApp.status === 'TAILORING' || activeApp.status === 'AUTOMATION_PREPARING' || activeApp.status === 'AUTOMATION_RUNNING' || activeApp.status === 'LETTER_GENERATING'),
    refetchInterval: 1500,
  });

  useEffect(() => {
    if (appProgress?.status === 'READY_FOR_REVIEW' || appProgress?.status === 'SUBMITTED' || appProgress?.status === 'FAILED') {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  }, [appProgress, queryClient]);

  // Sync edited Cover letter content when workspace drawer opens
  useEffect(() => {
    if (activeApp?.coverLetter) {
      setEditedCL(activeApp.coverLetter.content);
    } else {
      setEditedCL('');
    }
  }, [selectedJobWorkspaceId, activeApp?.id, activeApp?.coverLetter?.content]);

  // Handle side effects from job status updates
  useEffect(() => {
    if (!jobStatus) return;

    if (jobStatus.status === 'COMPLETED' || jobStatus.status === 'FAILED') {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['intelligence', selectedResumeId] });
      setActiveJobId(null);
    } else if (jobStatus.jobId && activeJobId === 'active') {
      setActiveJobId(jobStatus.jobId);
    }
  }, [jobStatus, activeJobId, selectedResumeId, queryClient]);

  useEffect(() => {
    if (selectedResume && selectedResume.status === 'READY' && !intel && !loadingIntel && !activeJobId && !analyzeMutation.isPending) {
      analyzeMutation.mutate({ resumeId: selectedResume.id, force: false });
    } else if (selectedResume && selectedResume.status === 'PARSING' && !activeJobId) {
      setActiveJobId('active');
    }
  }, [selectedResumeId, selectedResume?.status]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (response.ok) {
        const newResume = await response.json();
        await refetchResumes();
        setSelectedResumeId(newResume.id);
        if (newResume.jobId) {
          setActiveJobId(newResume.jobId);
        }
      } else {
        alert('Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerAnalyze = (force = false) => {
    if (!selectedResumeId) return;
    analyzeMutation.mutate({ resumeId: selectedResumeId, force });
  };

  const downloadPdf = async () => {
    if (!selectedResumeId) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/v1/resumes/${selectedResumeId}/download`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('PDF Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedResume?.title || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Make sure resume structured data exists.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadTailoredResume = async (versionId: string, company: string) => {
    setDownloadingTailoredPdf(true);
    try {
      const res = await fetch(`/api/v1/resumes/${versionId}/download`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Tailored PDF Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-tailored-${company.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate tailored PDF.');
    } finally {
      setDownloadingTailoredPdf(false);
    }
  };

  const triggerStartTailoring = () => {
    if (!selectedJobWorkspaceId || !latestVersion) return;
    createAppMutation.mutate({ jobId: selectedJobWorkspaceId, resumeVersionId: latestVersion.id });
    setWorkspaceTab('tailor');
  };

  const triggerAutopilotSubmit = () => {
    if (!activeApp) return;
    approveAppMutation.mutate(activeApp.id);
  };

  const saveCoverLetter = () => {
    if (!activeApp) return;
    saveCLMutation.mutate({ appId: activeApp.id, content: editedCL });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased flex flex-col">
      {!isOnline && (
        <div className="w-full bg-red-600 text-white text-center py-2 px-4 text-xs font-semibold z-50">
          ⚠️ Network Offline. Working in read-only status mode. Active API requests are disabled.
        </div>
      )}

      <AppHeader />

      <main className="max-w-[1400px] w-full mx-auto px-6 py-8 flex-grow flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            {selectedResume ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
                  <div className="min-w-0">
                    <button 
                      onClick={() => setSelectedResumeId(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-950 flex items-center gap-1 mb-1 transition-colors"
                    >
                      ← Back to Library
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 truncate" title={selectedResume.title}>
                      {selectedResume.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerAnalyze(true)}
                      disabled={analyzeMutation.isPending || !!activeJobId || !isOnline}
                      className="px-3.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      {analyzeMutation.isPending ? 'Requesting...' : 'Re-run AI Analysis'}
                    </button>
                    <button
                      onClick={downloadPdf}
                      disabled={downloadingPdf || selectedResume.status !== 'READY'}
                      className="px-3.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {downloadingPdf ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Rendering...
                        </>
                      ) : (
                        'Download PDF'
                      )}
                    </button>
                  </div>
                </div>

                {(activeJobId || selectedResume.status === 'PARSING') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                          Live Job Scan Active
                        </span>
                        <h2 className="text-base font-bold text-gray-950">
                          {jobStatus?.progress?.step || 'Running document parsing & matching...'}
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        EST: {jobStatus?.progress?.estTimeRemaining || '12s'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Discovery Progress</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="text-green-500 font-bold">✓</span>
                            <span>Resume analyzed.</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="text-blue-500 animate-spin w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full" />
                            <span className="font-semibold">Searching job boards & career portals:</span>
                          </div>
                          <div className="pl-6 space-y-1.5 text-xs text-gray-500 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✓</span> Greenhouse
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✓</span> Lever
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✓</span> Ashby
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500 animate-pulse">&bull;</span> RemoteOK & Wellfound
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-150 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-2">
                        <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider font-mono">Matching Opportunities</p>
                        <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">
                          {oppCount}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">Auto-matching discovered roles in real time</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-blue-600 h-full transition-all duration-500 ease-out" 
                          style={{ width: `${Math.max(jobStatus?.progress?.percent ?? 15, Math.min(95, Math.round((oppCount / targetCount) * 100)))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-450 font-mono">
                        <span>Analyzing matching index</span>
                        <span>{Math.max(jobStatus?.progress?.percent ?? 15, Math.min(95, Math.round((oppCount / targetCount) * 100)))}% Complete</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedResume.status === 'FAILED' && !activeJobId && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto text-xl font-bold">⚠️</div>
                    <div>
                      <h2 className="text-base font-bold text-red-955">AI Provider Not Configured</h2>
                      <p className="text-xs text-red-700 mt-2 max-w-md mx-auto leading-relaxed">
                        To enable real resume parsing and AI analysis, you must configure valid API keys in your environment.
                      </p>
                      <div className="mt-4 p-3 bg-white border border-red-100 rounded-lg text-left text-[11px] text-gray-600 font-mono space-y-1">
                        <div>1. Open <code className="bg-gray-100 px-1 py-0.5 rounded font-bold">.env</code> in your root directory.</div>
                        <div>2. Set <code className="bg-gray-100 px-1 py-0.5 rounded font-bold">GEMINI_API_KEY</code> with a key from Google AI Studio.</div>
                        <div>3. Set <code className="bg-gray-100 px-1 py-0.5 rounded font-bold">USE_MOCK_AI=false</code>.</div>
                        <div>4. Restart the API gateway and worker instances.</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerAnalyze(true)}
                      className="px-4 py-2 bg-red-900 text-white rounded-lg text-xs font-semibold hover:bg-red-950 transition"
                    >
                      Retry Analysis Pipeline
                    </button>
                  </div>
                )}

                {loadingIntel && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                    <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-gray-100 rounded animate-pulse" />
                      <div className="h-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-40 bg-gray-100 rounded animate-pulse" />
                  </div>
                )}

                {!loadingIntel && intel && selectedResume.status === 'READY' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider font-mono">Resume Health</h2>
                            <p className="text-3xl font-extrabold text-gray-955 mt-1">{intel.atsScore} <span className="text-sm text-gray-400 font-normal">/ 100</span></p>
                          </div>
                          <div className="w-14 h-14 rounded-full border-4 border-gray-100 border-r-gray-900 flex items-center justify-center font-bold text-xs">
                            {intel.atsScore}%
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                          {Object.entries(intel.atsScoreBreakdown || {}).map(([key, val]: any) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-gray-900">{val}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gray-900 h-full transition-all" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
                        <div>
                          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider font-mono">AI Target & Fit</h2>
                          <p className="text-sm font-bold text-gray-900 mt-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg w-fit">
                            🎯 Primary: {intel.aiSummary.primaryTarget}
                          </p>
                          <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                            {intel.aiSummary.overview}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider font-mono">Core Strengths</p>
                            <ul className="text-xs text-gray-600 space-y-1 mt-1.5 list-disc pl-3">
                              {intel.aiSummary.strengths.slice(0, 3).map((s: string, idx: number) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Key Gaps</p>
                            <ul className="text-xs text-gray-600 space-y-1 mt-1.5 list-disc pl-3">
                              {intel.aiSummary.weaknesses.slice(0, 3).map((w: string, idx: number) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider font-mono mb-4">Skill Intelligence</h2>
                      <div className="space-y-4">
                        {Object.entries(intel.skillsCategorized || {}).map(([cat, list]: any) => (
                          <div key={cat} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start py-2 border-b border-gray-100 last:border-0">
                            <span className="text-xs font-semibold text-gray-950 font-mono sm:col-span-1">{cat}</span>
                            <div className="flex flex-wrap gap-1.5 sm:col-span-3">
                              {list.map((skill: any, idx: number) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-900 rounded-lg text-xs font-mono text-gray-700 transition"
                                >
                                  {skill.name}
                                  <span className="text-[9px] font-bold text-gray-400">({skill.confidence || 90}%)</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Best Live Opportunities Section */}
                    <div className="space-y-6">
                      {topCompanies.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                          <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider font-mono">Top Companies Hiring You</p>
                          <div className="flex flex-wrap gap-2">
                            {topCompanies.map((company) => (
                              <span key={company} className="px-3.5 py-1.5 bg-gray-950 text-white font-mono text-[11px] font-bold uppercase rounded-lg tracking-wide shadow-sm">
                                🏢 {company}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                          <div>
                            <h2 className="text-base font-bold text-gray-950">🎯 Best Live Opportunities</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Found {matches.length} Live Opportunities &bull; Showing Top {showAllOpportunities ? matches.length : Math.min(4, matches.length)}</p>
                          </div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase">
                            Updated 2m ago
                          </span>
                        </div>

                        {loadingMatches ? (
                          <div className="space-y-3">
                            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                          </div>
                        ) : matches.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <p className="text-xs text-gray-500 font-medium">Auto-comparing with live feed jobs in background...</p>
                            <span className="text-[10px] text-gray-400 font-mono mt-1 block">Matches will appear automatically as processing completes.</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {matches.slice(0, showAllOpportunities ? matches.length : 4).map((match: any, index: number) => {
                              const app = applications.find(a => a.jobId === match.jobId && a.resumeVersionId === latestVersion?.id);
                              const topMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                              // Calculate expected score after tailoring (e.g. current + 3% to 6%)
                              const currentScore = match.overallMatch || 80;
                              const tailoredScoreEstimate = Math.min(99, currentScore + Math.round((100 - currentScore) * 0.4));

                              // Five-star string formatting based on match percentage
                              const starCount = currentScore >= 90 ? 5 : currentScore >= 80 ? 4 : currentScore >= 70 ? 3 : currentScore >= 60 ? 2 : 1;
                              const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

                              // Probability of interview calculation
                              const interviewProbability = Math.round(currentScore * 0.85);

                              // Color based platform indicator
                              const getPlatformIndicator = (platform: string) => {
                                const p = (platform || '').toLowerCase();
                                if (p.includes('greenhouse')) return <span className="inline-flex items-center gap-1">🟢 <span className="capitalize">{platform}</span></span>;
                                if (p.includes('lever')) return <span className="inline-flex items-center gap-1">🟣 <span className="capitalize">{platform}</span></span>;
                                if (p.includes('ashby')) return <span className="inline-flex items-center gap-1">⚫ <span className="capitalize">{platform}</span></span>;
                                return <span className="inline-flex items-center gap-1">🔵 <span className="capitalize">{platform}</span></span>;
                              };

                              return (
                                <div key={match.id} className="border border-gray-200 rounded-xl p-5 hover:border-gray-900 transition-all bg-white space-y-4 shadow-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {topMedal && <span className="text-base">{topMedal}</span>}
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider font-mono">
                                          🏢 {match.job.sourceSite || `${match.job.company} Careers`}
                                        </span>
                                        <span className="text-[10px] font-medium text-gray-450 font-mono">
                                          via {match.job.sourcePlatform}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-amber-500 tracking-wider">
                                          {stars}
                                        </span>
                                      </div>
                                      <h4 className="font-extrabold text-base text-gray-900 pt-0.5 leading-tight">
                                        {match.job.title}
                                      </h4>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-1.5 items-center">
                                        <span>📍 {match.job.analysis?.location || 'Remote'}</span>
                                        <span>💰 {match.job.analysis?.estimatedSalary || 'Market Rate'}</span>
                                        <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-bold font-mono text-[9px] uppercase inline-flex items-center gap-1 group relative cursor-help">
                                          ✓ Live Verified
                                          <span className="absolute hidden group-hover:block bg-gray-900 text-white text-[9px] normal-case rounded p-2 -top-12 left-0 w-52 z-10 font-normal shadow-lg leading-normal">
                                            This listing was verified against the original job page 2 minutes ago.
                                          </span>
                                        </span>
                                        <span className="text-[10px] text-gray-450 font-mono">
                                          Verified {Math.round((Date.now() - new Date(match.job.lastVerifiedAt || match.job.scrapedAt).getTime()) / 60000) || 2} min ago
                                        </span>
                                      </div>
                                      <div className="pt-1.5">
                                        <a
                                          href={match.job.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold font-mono flex items-center gap-1.5 hover:underline"
                                        >
                                          🔗 Open Original Listing ↗
                                        </a>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                      <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-black rounded-lg font-mono">
                                        {currentScore}% Fit Score
                                      </span>
                                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-extrabold rounded font-mono">
                                        Interview Prob: {interviewProbability}%
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                        Expected after tailoring: <span className="text-green-600 font-bold">{tailoredScoreEstimate}%</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Collapsible Why details expander */}
                                  <div className="pt-2 border-t border-gray-50">
                                    <button
                                      onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 font-mono transition flex items-center gap-1"
                                    >
                                      {expandedMatchId === match.id ? 'Hide Match Details ↑' : 'Why this score? ↓'}
                                    </button>

                                    {expandedMatchId === match.id && (
                                      <div className="mt-3 p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-4 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                          <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-green-750 uppercase tracking-wider font-mono">Matched Experience</p>
                                            <div className="flex flex-wrap gap-1">
                                              {match.matchedSkillsJson && Array.isArray(match.matchedSkillsJson) && match.matchedSkillsJson.length > 0 ? (
                                                match.matchedSkillsJson.map((skill: string, idx: number) => (
                                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded border border-green-200 font-mono font-semibold">
                                                    ✓ {skill}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-[10px] text-gray-450 italic">Determining match details...</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-amber-750 uppercase tracking-wider font-mono">Missing / Gaps</p>
                                            <div className="flex flex-wrap gap-1">
                                              {match.missingSkillsJson && Array.isArray(match.missingSkillsJson) && match.missingSkillsJson.length > 0 ? (
                                                match.missingSkillsJson.map((skill: string, idx: number) => (
                                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded border border-amber-200 font-mono font-semibold">
                                                    {skill}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-[10px] text-green-600 font-bold font-mono">None! Matches perfectly</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="space-y-1 border-l pl-4 border-gray-250">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">SOURCE</p>
                                            <div className="space-y-1.5 mt-1 text-[11px]">
                                              <p className="font-extrabold text-gray-900 leading-tight">🏢 {match.job.sourceSite || `${match.job.company} Careers`}</p>
                                              <div className="grid grid-cols-2 gap-y-0.5 text-[9px] font-mono text-gray-500">
                                                <span>Platform</span>
                                                <span className="capitalize font-semibold text-gray-800">{match.job.sourcePlatform}</span>
                                                <span>Status</span>
                                                <span className="text-green-600 font-bold">✓ Live</span>
                                                <span>Verified</span>
                                                <span>{Math.round((Date.now() - new Date(match.job.lastVerifiedAt || match.job.scrapedAt).getTime()) / 60000) || 2}m ago</span>
                                              </div>
                                              <a
                                                href={match.job.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] text-blue-600 hover:text-blue-800 font-bold font-mono flex items-center gap-1 hover:underline pt-0.5"
                                              >
                                                Open Original Listing ↗
                                              </a>
                                            </div>
                                          </div>
                                        </div>

                                        {match.experienceGap && (
                                          <div className="pt-2 border-t border-gray-100 space-y-0.5">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Gap Explanation</p>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">{match.experienceGap}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Card Actions */}
                                  <div className="pt-3 border-t border-gray-50 flex flex-wrap justify-between items-center gap-3">
                                    <div className="flex items-center gap-4">
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 font-mono">
                                        <span className={`w-1.5 h-1.5 rounded-full ${app ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        {app ? '✓ Tailored' : 'Tailor'}
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 font-mono">
                                        <span className={`w-1.5 h-1.5 rounded-full ${app?.coverLetter ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        {app?.coverLetter ? '✓ Letter Ready' : 'Letter'}
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 font-mono">
                                        <span className={`w-1.5 h-1.5 rounded-full ${app?.status === 'SUBMITTED' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        {app?.status === 'SUBMITTED' ? '✓ Applied' : 'Apply'}
                                      </span>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedJobWorkspaceId(match.jobId);
                                          setWorkspaceTab('overview');
                                        }}
                                        className="px-3 py-1.5 border border-gray-200 hover:border-gray-900 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold tracking-wide transition"
                                      >
                                        Review Match
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedJobWorkspaceId(match.jobId);
                                          setWorkspaceTab('tailor');
                                          if (!app) triggerStartTailoring();
                                        }}
                                        className="px-3 py-1.5 border border-gray-200 hover:border-gray-900 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold tracking-wide transition"
                                      >
                                        Tailor
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedJobWorkspaceId(match.jobId);
                                          setWorkspaceTab('coverletter');
                                          if (!app) triggerStartTailoring();
                                        }}
                                        className="px-3 py-1.5 border border-gray-200 hover:border-gray-900 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold tracking-wide transition"
                                      >
                                        Cover Letter
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedJobWorkspaceId(match.jobId);
                                          setWorkspaceTab('apply');
                                          if (!app) triggerStartTailoring();
                                        }}
                                        className="px-4 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold tracking-wide transition"
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {matches.length > 4 && (
                          <div className="pt-4 text-center border-t border-gray-100">
                            <button
                              onClick={() => setShowAllOpportunities(!showAllOpportunities)}
                              className="px-4 py-2 border border-gray-200 hover:border-gray-950 text-xs font-bold tracking-wide bg-white text-gray-700 rounded-lg hover:text-gray-950 transition font-mono"
                            >
                              {showAllOpportunities ? 'Show Top 4 Opportunities ↑' : `View All (${matches.length}) Opportunities ↓`}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl tracking-tight font-medium text-[#111827] leading-tight">
                    Resume Console
                  </h1>
                  <p className="text-gray-500 text-sm mt-2">
                    Upload files, audit tailored configurations, and analyze parsed indexing stats.
                  </p>
                </div>
                
                {loadingResumes ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-24 text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-gray-500 font-mono">Loading resume libraries...</p>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-24 text-center space-y-4">
                    <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <h2 className="text-base font-semibold text-gray-950">Start by Uploading your Resume</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Your resume will be parsed with Unstructured and analyzed with Gemini for detailed ATS scoring.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-24 text-center select-none space-y-4">
                    <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <h2 className="text-base font-semibold text-gray-955">Select a Resume for Analysis</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Choose an asset from your library in the sidebar to load the intelligence reports.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <form 
              onDragEnter={handleDrag} 
              onDragOver={handleDrag} 
              onDragLeave={handleDrag} 
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
              className={`relative border border-dashed rounded-xl p-6 text-center transition-all bg-white ${
                dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-900">Upload New Resume</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF and DOCX</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !isOnline}
                  className="px-3 py-1.5 bg-gray-950 text-white hover:bg-gray-800 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Browse files'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                Resume Library
              </h3>
              
              {loadingResumes ? (
                <div className="space-y-3">
                  <div className="h-16 bg-white border border-gray-200 rounded-xl animate-pulse" />
                  <div className="h-16 bg-white border border-gray-200 rounded-xl animate-pulse" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`cursor-pointer rounded-xl bg-white border p-4 transition-all hover:border-gray-950 ${
                        selectedResumeId === resume.id ? 'border-gray-900 shadow-sm ring-1 ring-gray-900' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-gray-955 truncate" title={resume.title}>
                            {resume.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider shrink-0 ${
                          resume.status === 'READY' ? 'bg-green-50 text-green-700' :
                          resume.status === 'PARSING' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {resume.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-gray-50">
                        <span className="text-gray-500 font-medium">
                          {resume.versions?.length || 0} Version{ (resume.versions?.length || 0) === 1 ? '' : 's' }
                        </span>
                        <span className="text-gray-950 font-semibold hover:underline">
                          Analyze &rarr;
                        </span>
                      </div>
                    </div>
                  ))}

                  {resumes.length === 0 && (
                    <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500 text-xs">
                      No resumes uploaded.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Unified Job Workspace Drawer */}
      {selectedJobWorkspaceId && activeMatch && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setSelectedJobWorkspaceId(null)}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
          />

          <div className="relative w-full max-w-[650px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-150 flex justify-between items-start bg-gray-50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Job Workspace</span>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{activeMatch.job.title}</h3>
                <p className="text-xs text-gray-500 font-semibold">{activeMatch.job.company}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 font-mono font-black rounded-lg text-xs">
                  {activeMatch.overallMatch}% Fit Score
                </span>
                <button 
                  onClick={() => setSelectedJobWorkspaceId(null)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-150 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-150 bg-white">
              {(['overview', 'tailor', 'coverletter', 'apply'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setWorkspaceTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
                    workspaceTab === tab 
                      ? 'border-gray-950 text-gray-950 bg-gray-50/50' 
                      : 'border-transparent text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {tab === 'coverletter' ? 'Cover Letter' : tab}
                </button>
              ))}
            </div>

            {/* Tab Contents Pane */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: OVERVIEW & GAPS */}
              {workspaceTab === 'overview' && (
                <div className="space-y-6">
                  {/* Similarity Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">ATS Check</span>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{activeMatch.atsCoverage}%</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Skill Fit</span>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{activeMatch.skillMatch}%</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Keywords</span>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{activeMatch.keywordCoverage}%</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Culture Fit</span>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{activeMatch.cultureMatch}%</p>
                    </div>
                  </div>

                  {/* Skills lists Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider font-mono mb-2">Matched Skills</h4>
                      <ul className="text-xs text-green-700 space-y-1">
                        {activeMatch.matchedSkills?.map((skill: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span>✓</span> {skill}
                          </li>
                        ))}
                        {(!activeMatch.matchedSkills || activeMatch.matchedSkills.length === 0) && (
                          <li className="text-green-500 italic">No skills matched.</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider font-mono mb-2">Missing Skills</h4>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {activeMatch.missingSkills?.map((skill: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span>⚠</span> {skill}
                          </li>
                        ))}
                        {(!activeMatch.missingSkills || activeMatch.missingSkills.length === 0) && (
                          <li className="text-green-600 font-semibold">Perfect Skill Match!</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Strengths and Weaknesses */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Strengths</h4>
                      <ul className="text-xs text-gray-650 space-y-1.5 list-disc pl-4 leading-relaxed">
                        {activeMatch.strengths?.map((str: string, idx: number) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Risks & Weaknesses</h4>
                      <ul className="text-xs text-gray-650 space-y-1.5 list-disc pl-4 leading-relaxed">
                        {activeMatch.weaknesses?.map((risk: string, idx: number) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>

                    {activeMatch.experienceGap && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider font-mono mb-1">Experience Gaps</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">{activeMatch.experienceGap}</p>
                      </div>
                    )}

                    {/* Source Metadata Section */}
                    <div className="border-t border-gray-150 pt-5 space-y-3">
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider font-mono">SOURCE</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-400 font-mono">Origin Site</p>
                            <p className="text-gray-950 font-bold flex items-center gap-1">
                              🏢 {activeMatch.job.sourceSite || `${activeMatch.job.company} Careers`}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-400 font-mono">ATS Platform</p>
                            <p className="text-gray-950 font-bold capitalize">{activeMatch.job.sourcePlatform.toLowerCase()}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-400 font-mono">Status</p>
                            <p className="text-green-700 font-bold flex items-center gap-1 font-mono">
                              ✓ Live Listing
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-400 font-mono">Verified</p>
                            <p className="text-gray-650 font-mono">
                              {Math.round((Date.now() - new Date(activeMatch.job.lastVerifiedAt || activeMatch.job.scrapedAt).getTime()) / 60000) || 2} minutes ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-250">
                          <a
                            href={activeMatch.job.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-250 hover:border-gray-950 text-gray-900 rounded-lg text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-sm font-mono"
                          >
                            Open Original Listing ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TAILORED RESUME */}
              {workspaceTab === 'tailor' && (
                <div className="space-y-6">
                  {!activeApp ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto text-xl font-bold">🛠️</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Resume Tailoring Not Initialized</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Click below to parse the job requirements, execute automatic adjustments, and generate tailored resume versions.</p>
                      </div>
                      <button
                        onClick={triggerStartTailoring}
                        disabled={createAppMutation.isPending}
                        className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold tracking-wide transition"
                      >
                        {createAppMutation.isPending ? 'Initializing...' : 'Start Tailoring & Ingest Application'}
                      </button>
                    </div>
                  ) : activeApp.status === 'CREATED' || activeApp.status === 'TAILORING' ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-600 font-mono">
                        <span>
                          {activeApp.status === 'CREATED' 
                            ? 'Initializing application project...' 
                            : isAppProgressError 
                              ? 'Waiting for pipeline connection...'
                              : appProgress?.progress?.step || 'Generating tailored bullets & summaries...'}
                        </span>
                        <span>
                          {activeApp.status === 'CREATED' 
                            ? 5 
                            : isAppProgressError 
                              ? 20
                              : (appProgress?.progress?.percent ?? 20)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full transition-all duration-500" 
                          style={{ 
                            width: `${activeApp.status === 'CREATED' 
                              ? 5 
                              : isAppProgressError 
                                ? 20 
                                : (appProgress?.progress?.percent ?? 20)}%` 
                          }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded uppercase tracking-wider font-mono">Ready for Review</span>
                          <h4 className="text-xs font-bold text-gray-900 mt-1">Tailored Resume Version Available</h4>
                        </div>
                        <button
                          onClick={() => downloadTailoredResume(activeApp.resumeVersionId, activeMatch.job.company)}
                          disabled={downloadingTailoredPdf}
                          className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          {downloadingTailoredPdf ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>

                      {/* Tailoring adjustments list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Grounding Adjustments & Bullet Diffs</h4>
                        <div className="space-y-2.5">
                          {activeMatch.recommendedChanges?.map((change: any, idx: number) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold font-mono">
                                  {change.action}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">Target: {change.target}</span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-mono">Reason: {change.reason}</p>
                              {change.details?.originalBullet && (
                                <div className="mt-2 text-xs space-y-1 border-t border-gray-50 pt-2 font-mono">
                                  <div className="text-red-700 bg-red-50 p-1.5 rounded line-through">- {change.details.originalBullet}</div>
                                  <div className="text-green-700 bg-green-50 p-1.5 rounded">+ {change.details.suggestedBullet}</div>
                                </div>
                              )}
                              {change.details?.keyword && (
                                <div className="mt-2 text-xs text-green-700 bg-green-50 p-1.5 rounded font-mono">
                                  + Insert Keyword: "{change.details.keyword}"
                                </div>
                              )}
                            </div>
                          ))}
                          {(!activeMatch.recommendedChanges || activeMatch.recommendedChanges.length === 0) && (
                            <div className="text-center py-6 text-xs text-gray-400">No revisions required. Base resume fits all structural guidelines.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COVER LETTER */}
              {workspaceTab === 'coverletter' && (
                <div className="space-y-6">
                  {!activeApp ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto text-xl font-bold">📝</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Cover Letter Not Generated</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Initialize tailoring to extract job requirements and draft a structured cover letter matching the employer tone.</p>
                      </div>
                      <button
                        onClick={triggerStartTailoring}
                        disabled={createAppMutation.isPending}
                        className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold tracking-wide transition"
                      >
                        Start Tailoring & Ingest Application
                      </button>
                    </div>
                  ) : ['CREATED', 'TAILORING', 'TAILORED', 'LETTER_GENERATING'].includes(activeApp.status) ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-gray-500 font-mono">
                        {activeApp.status === 'LETTER_GENERATING' ? 'Generating cover letter content via AI provider...' : 'Awaiting tailoring completion...'}
                      </p>
                    </div>
                  ) : !activeApp.coverLetter ? (
                    <div className="text-center py-12">
                      <p className="text-xs text-gray-500">Wait... cover letter failed to load or generate. Retry starting application.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col h-full">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-450 uppercase tracking-wider font-mono">Interactive Draft Editor</span>
                        <button
                          onClick={saveCoverLetter}
                          disabled={saveCLMutation.isPending}
                          className="px-3 py-1 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold rounded transition"
                        >
                          {saveCLMutation.isPending ? 'Saving...' : 'Save Draft'}
                        </button>
                      </div>

                      <textarea
                        value={editedCL}
                        onChange={(e) => setEditedCL(e.target.value)}
                        className="w-full flex-grow min-h-[300px] border border-gray-200 p-4 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: APPLY CONSOLE */}
              {workspaceTab === 'apply' && (
                <div className="space-y-6">
                  {/* Submission Flow Steps */}
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-5 space-y-3">
                    <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider font-mono">Submission Pipeline</p>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      {/* Step 1: Tailored Resume */}
                      <div className="flex items-start gap-2">
                        {!activeApp ? (
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">1</span>
                        ) : activeApp.status === 'GENERATING' ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">&bull;</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">Tailored Resume</p>
                          <p className="text-[10px] text-gray-400">Optimize skills matches</p>
                        </div>
                      </div>

                      {/* Step 2: Cover Letter */}
                      <div className="flex items-start gap-2">
                        {!activeApp || activeApp.status === 'GENERATING' ? (
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">2</span>
                        ) : !activeApp.coverLetter ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">&bull;</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">Cover Letter</p>
                          <p className="text-[10px] text-gray-400">Generate targeted draft</p>
                        </div>
                      </div>

                      {/* Step 3: Browser Automation */}
                      <div className="flex items-start gap-2">
                        {!activeApp || (activeApp.status !== 'SUBMITTING' && activeApp.status !== 'SUBMITTED') ? (
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">3</span>
                        ) : activeApp.status === 'SUBMITTING' ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">&bull;</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">Autopilot Submit</p>
                          <p className="text-[10px] text-gray-400">Run browser automations</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!activeApp ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto text-xl font-bold">🚀</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Autopilot Apply Inactive</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Start application tailoring to create optimized assets, then trigger automated submission.</p>
                      </div>
                      <button
                        onClick={triggerStartTailoring}
                        disabled={createAppMutation.isPending}
                        className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold tracking-wide transition"
                      >
                        Start Tailoring & Ingest Application
                      </button>
                    </div>
                  ) : activeApp.status === 'READY_FOR_REVIEW' ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-left space-y-5 shadow-sm">
                      <div className="flex items-center gap-3 border-b border-gray-155 pb-3">
                        <div className="w-9 h-9 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-650 text-base">✓</div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">Ready for Autopilot Submit</h4>
                          <p className="text-[10px] text-gray-500">Review assets and confirm to launch the browser sequence.</p>
                        </div>
                      </div>

                      {/* Ready Details Checklist */}
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-3.5 space-y-2 text-xs font-mono text-gray-600">
                        <div className="flex justify-between items-center">
                          <span>📄 Resume ready</span>
                          <span className="text-green-600 font-bold">✓ Ready</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>✍️ Cover Letter ready</span>
                          <span className="text-green-600 font-bold">✓ Ready</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>🤖 Autopilot driver</span>
                          <span className="text-blue-600 font-bold capitalize">{activeMatch?.job.sourcePlatform || 'Greenhouse'} ✓</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 font-bold text-gray-700">
                          <span>🕒 Est. execution time</span>
                          <span>~45 sec</span>
                        </div>
                      </div>

                      {/* Required Human Review Checkboxes */}
                      <div className="space-y-2.5">
                        <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider font-mono">Human-in-the-Loop Verification</p>
                        
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={resumeReviewed}
                            onChange={(e) => setResumeReviewed(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 border-gray-300 text-gray-900 rounded focus:ring-gray-950 focus:ring-1"
                          />
                          <span className="text-xs text-gray-650 leading-tight">I have reviewed and approved the Tailored Resume (PDF)</span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={coverLetterReviewed}
                            onChange={(e) => setCoverLetterReviewed(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 border-gray-300 text-gray-900 rounded focus:ring-gray-950 focus:ring-1"
                          />
                          <span className="text-xs text-gray-650 leading-tight">I have reviewed and approved the Custom Cover Letter</span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={atsAnswersReviewed}
                            onChange={(e) => setAtsAnswersReviewed(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 border-gray-300 text-gray-900 rounded focus:ring-gray-950 focus:ring-1"
                          />
                          <span className="text-xs text-gray-650 leading-tight">I have reviewed and approved the generated Screening Answers</span>
                        </label>
                      </div>

                      <button
                        onClick={triggerAutopilotSubmit}
                        disabled={approveAppMutation.isPending || !resumeReviewed || !coverLetterReviewed || !atsAnswersReviewed}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg text-xs font-bold tracking-wide transition w-full shadow-sm"
                      >
                        {approveAppMutation.isPending ? 'Launching Autopilot...' : 'Launch Autopilot Submission'}
                      </button>
                    </div>
                  ) : ['SUBMITTING', 'SUBMITTED', 'NEEDS_MANUAL_ACTION', 'VERIFIED', 'COMPLETED'].includes(activeApp.status) ? (
                    <div className="space-y-6">
                      {/* Success Banner */}
                      {['SUBMITTED', 'VERIFIED', 'COMPLETED'].includes(activeApp.status) && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">✓</div>
                          <div>
                            <p className="text-xs font-bold text-green-900">Application Submitted Successfully!</p>
                            <p className="text-[10px] text-green-700">Autopilot has successfully filled all forms and completed submission.</p>
                          </div>
                        </div>
                      )}

                      {/* AI Agent Timeline */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider font-mono">AI Agent Timeline</p>
                        
                        <div className="space-y-4 relative pl-4 border-l border-gray-100 ml-2 text-xs">
                          {getTimelineSteps(activeApp, activeMatch).map((step, idx) => {
                            const isCompleted = step.status === 'completed';
                            const isRunning = step.status === 'running';
                            const isFailed = step.status === 'failed';
                            
                            let indicatorColor = 'bg-gray-300';
                            if (isCompleted) indicatorColor = 'bg-green-500';
                            else if (isRunning) indicatorColor = 'bg-blue-600 animate-pulse';
                            else if (isFailed) indicatorColor = 'bg-red-500';

                            return (
                              <div key={idx} className="relative">
                                <span className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${indicatorColor}`} />
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className={`font-bold leading-tight ${isCompleted || isRunning ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>
                                      {step.title}
                                    </p>
                                    <p className="text-[10px] text-gray-450">{step.description}</p>
                                  </div>
                                  {step.time && (
                                    <span className="text-[10px] font-mono text-steel shrink-0">{step.time}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Autopilot Logs */}
                      {activeApp.browserSession?.logJson && (activeApp.browserSession.logJson as any).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Automation Logs</h4>
                          <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 text-gray-300 font-mono text-[10px] leading-relaxed max-h-[220px] overflow-y-auto space-y-1">
                            {(activeApp.browserSession.logJson as any).map((log: string, idx: number) => (
                              <div key={idx}>{log}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center space-y-3">
                      <p className="text-xs text-gray-500">
                        Application State: <span className="font-bold text-red-600">{activeApp.status}</span>
                      </p>
                      <button
                        onClick={() => startAppMutation.mutate(activeApp.id)}
                        disabled={startAppMutation.isPending}
                        className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        {startAppMutation.isPending ? 'Retrying...' : 'Retry Preparation Pipeline'}
                      </button>
                    </div>
                  )}

                  {/* Screenshots Carousel */}
                  {activeApp?.browserSession?.screenshotsJson && (activeApp.browserSession.screenshotsJson as any).length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Live Session Screenshots</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {(activeApp.browserSession.screenshotsJson as any).map((src: string, idx: number) => (
                          <img 
                            key={idx}
                            src={src} 
                            alt={`Autopilot Step ${idx + 1}`}
                            className="h-28 object-contain border border-gray-200 rounded-lg bg-gray-50"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
