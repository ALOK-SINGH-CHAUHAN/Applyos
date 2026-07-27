'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useAuth, AuthProvider } from '../../context/AuthContext';

interface MatchResult {
  id: string;
  resumeVersionId: string;
  jobId: string;
  overallMatch: number;
  atsCoverage: number;
  keywordCoverage: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  cultureMatch: number;
  interviewReadiness: number;
  interviewProbability: string;
  confidence: number;
  strengthsJson: string[];
  weaknessesJson: string[];
  missingSkillsJson: string[];
  matchedSkillsJson: string[];
  experienceGap?: string;
  recommendedChangesJson: Array<{
    action: string;
    target: string;
    reason: string;
    details?: {
      keyword?: string;
      section?: string;
      originalBullet?: string;
      suggestedBullet?: string;
    };
  }>;
  createdAt: string;
}

interface Resume {
  id: string;
  title: string;
  versions: Array<{
    id: string;
    atsScore?: number;
    createdAt: string;
  }>;
}

interface Job {
  id: string;
  company: string;
  title: string;
  sourcePlatform: string;
  sourceUrl: string;
  metadata?: {
    location?: string;
    salaryText?: string;
    employmentType?: string;
  } | null;
  analysis?: {
    estimatedSalary?: string;
    experienceRequired?: string;
    difficultyScore?: string;
  } | null;
}

export default function MatchesPageWrapper() {
  return (
    <AuthProvider>
      <MatchesPage />
    </AuthProvider>
  );
}

function MatchesPage() {
  const { authHeaders } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'recommended' | 'advanced'>('recommended');

  // Library States
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // Selected Profile
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Job Workspace Drawer
  const [workspaceJob, setWorkspaceJob] = useState<Job | null>(null);
  const [workspaceMatch, setWorkspaceMatch] = useState<MatchResult | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'tailor' | 'cover' | 'apply'>('overview');

  // Keep these for legacy advanced tab usage
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [selectedMatchJob, setSelectedMatchJob] = useState<Job | null>(null);

  // Advanced Compare Selection
  const [advJobId, setAdvJobId] = useState<string>('');
  const [advMatch, setAdvMatch] = useState<MatchResult | null>(null);

  // Match / Compare Execution States
  const [loadingMatchJobId, setLoadingMatchJobId] = useState<string | null>(null);
  const [matchProgress, setMatchProgress] = useState<{ percent: number; step: string }>({ percent: 0, step: '' });
  const [compareFailed, setCompareFailed] = useState(false);

  // Tailoring States
  const [tailoring, setTailoring] = useState(false);
  const [tailorProgress, setTailorProgress] = useState<{ percent: number; step: string }>({ percent: 0, step: '' });
  const [tailoredVersion, setTailoredVersion] = useState<any | null>(null);
  const [tailorFailed, setTailorFailed] = useState(false);

  // Apply Pipeline States
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<{ percent: number; step: string } | null>(null);
  const [applyAppId, setApplyAppId] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Filter States
  const [minScore, setMinScore] = useState<number>(0);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  // Fetch initial resumes and jobs
  useEffect(() => {
    async function loadData() {
      try {
        const [resumesRes, jobsRes] = await Promise.all([
          fetch('/api/v1/resumes', { headers: authHeaders() }),
          fetch('/api/v1/jobs', { headers: authHeaders() })
        ]);
        if (resumesRes.ok) {
          const resumesData = await resumesRes.json();
          setResumes(resumesData);
          if (resumesData.length > 0) {
            setSelectedResumeId(resumesData[0].id);
          }
        }
        if (jobsRes.ok) {
          setJobs(await jobsRes.json());
        }
      } catch (err) {
        console.error('Error fetching libraries:', err);
      } finally {
        setLoadingLibrary(false);
      }
    }
    loadData();
  }, []);

  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  const latestVersionId = selectedResume?.versions?.[0]?.id || '';

  // Load matches whenever the selected resume latestVersionId changes
  const fetchMatches = async (versionId: string) => {
    try {
      const res = await fetch(`/api/v1/resumes/${versionId}/matches`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  useEffect(() => {
    if (latestVersionId) {
      fetchMatches(latestVersionId);
      // Reset selected match when switching resumes
      setSelectedMatch(null);
      setSelectedMatchJob(null);
      setAdvMatch(null);
      setAdvJobId('');
      setTailoredVersion(null);
    }
  }, [latestVersionId]);

  // Comparison BullMQ Trigger
  const handleCompare = async (jobId: string, isAdvanced = false) => {
    if (!latestVersionId || !jobId) return;

    setLoadingMatchJobId(jobId);
    setCompareFailed(false);
    setTailorFailed(false);
    setTailoredVersion(null);
    setMatchProgress({ percent: 10, step: 'Queueing analysis task...' });

    try {
      const res = await fetch(`/api/v1/resumes/${latestVersionId}/compare/${jobId}`, {
        method: 'POST',
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Compare request failed');
      const data = await res.json();

      if (data.status === 'COMPLETED') {
        // Refresh matches
        const resRefresh = await fetch(`/api/v1/resumes/${latestVersionId}/matches`, { headers: authHeaders() });
        if (resRefresh.ok) {
          const freshMatches = await resRefresh.json();
          setMatches(freshMatches);
          const matchObj = freshMatches.find((m: any) => m.jobId === jobId);
          if (isAdvanced) {
            setAdvMatch(matchObj);
          } else {
            setSelectedMatch(matchObj);
            setSelectedMatchJob(jobs.find(j => j.id === jobId) || null);
          }
        }
        setLoadingMatchJobId(null);
      } else {
        // Poll BullMQ status
        pollJobStatus(data.jobId, 'compare', jobId, isAdvanced);
      }
    } catch (err) {
      console.error(err);
      setCompareFailed(true);
      setLoadingMatchJobId(null);
    }
  };

  // Open the Job Workspace Drawer
  const openWorkspace = (job: Job, match: MatchResult | null) => {
    setWorkspaceJob(job);
    setWorkspaceMatch(match);
    setWorkspaceTab('overview');
    setApplyProgress(null);
    setApplyStatus(null);
    setApplyError(null);
    setApplyAppId(null);
  };

  const closeWorkspace = () => {
    setWorkspaceJob(null);
    setWorkspaceMatch(null);
  };

  // Apply Pipeline Trigger — creates application and polls progress
  const handleApply = async () => {
    if (!workspaceJob || !latestVersionId) return;
    setApplying(true);
    setApplyError(null);
    setApplyProgress({ percent: 5, step: 'Creating application record...' });
    setApplyStatus('CREATED');

    try {
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ jobId: workspaceJob.id, resumeVersionId: latestVersionId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create application');
      }

      const appData = await res.json();
      const applicationId = appData.id;
      setApplyAppId(applicationId);
      setApplyProgress({ percent: 10, step: 'Pipeline started — tailoring resume...' });

      // Poll application progress every 2.5s
      const pollInterval = setInterval(async () => {
        try {
          const progRes = await fetch(`/api/v1/applications/${applicationId}/progress`, {
            headers: authHeaders(),
          });
          if (!progRes.ok) return;
          const progData = await progRes.json();
          const { status, progress } = progData;

          setApplyStatus(status);
          if (progress) {
            setApplyProgress({ percent: progress.percent, step: progress.step });
          }

          // Terminal states
          if (status === 'READY_FOR_REVIEW' || status === 'SUBMITTED' || status === 'NEEDS_MANUAL_ACTION' || status === 'FAILED') {
            clearInterval(pollInterval);
            setApplying(false);
          }
        } catch (pollErr) {
          console.error('Apply poll error:', pollErr);
        }
      }, 2500);

      // Safety timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setApplying(false);
      }, 10 * 60 * 1000);

    } catch (err: any) {
      setApplyError(err.message || 'Application failed to start');
      setApplying(false);
      setApplyProgress(null);
    }
  };

  // Tailoring Trigger
  const handleTailor = async (jobId: string) => {
    if (!latestVersionId || !jobId) return;

    setTailoring(true);
    setTailorFailed(false);
    setTailoredVersion(null);
    setTailorProgress({ percent: 10, step: 'Queueing tailoring task...' });

    try {
      const res = await fetch(`/api/v1/resumes/${latestVersionId}/tailor/${jobId}`, {
        method: 'POST',
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Tailoring request failed');
      const data = await res.json();

      pollJobStatus(data.jobId, 'tailor', jobId, false);
    } catch (err) {
      console.error(err);
      setTailorFailed(true);
      setTailoring(false);
    }
  };

  // Poll BullMQ Job
  const pollJobStatus = (jobId: string, type: 'compare' | 'tailor', targetJobId: string, isAdvanced = false) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/resumes/matches/status/${jobId}`, {
          headers: authHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();

        const prog = data.progress || { percent: 0, step: 'Processing...' };

        if (type === 'compare') {
          setMatchProgress({ percent: prog.percent, step: prog.step });
        } else {
          setTailorProgress({ percent: prog.percent, step: prog.step });
        }

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          if (type === 'compare') {
            const resRefresh = await fetch(`/api/v1/resumes/${latestVersionId}/matches`, { headers: authHeaders() });
            if (resRefresh.ok) {
              const freshMatches = await resRefresh.json();
              setMatches(freshMatches);
              const matchObj = freshMatches.find((m: any) => m.jobId === targetJobId);
              if (isAdvanced) {
                setAdvMatch(matchObj);
              } else {
                setSelectedMatch(matchObj);
                setSelectedMatchJob(jobs.find(j => j.id === targetJobId) || null);
              }
            }
            setLoadingMatchJobId(null);
          } else {
            setTailoredVersion(data.result);
            setTailoring(false);
            // Refresh resumes list to get the new tailored version in library
            const resRefresh = await fetch('/api/v1/resumes', { headers: authHeaders() });
            if (resRefresh.ok) setResumes(await resRefresh.json());
          }
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          if (type === 'compare') {
            setCompareFailed(true);
            setLoadingMatchJobId(null);
          } else {
            setTailorFailed(true);
            setTailoring(false);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleDownloadPdf = async (versionId: string) => {
    try {
      const res = await fetch(`/api/v1/resumes/${versionId}/download`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to download PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tailored-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Error downloading PDF');
    }
  };

  // Compile recommendations list
  const recommendations = jobs.map(job => {
    const match = matches.find(m => m.jobId === job.id);
    return {
      job,
      match: match || null,
      score: match ? match.overallMatch : 0,
    };
  }).sort((a, b) => b.score - a.score);

  // Apply filters
  const filteredRecommendations = recommendations.filter(rec => {
    if (minScore > 0 && minScore > rec.score) return false;

    if (platform && rec.job.sourcePlatform.toLowerCase() !== platform.toLowerCase()) return false;

    if (locationSearch) {
      const loc = (rec.job.metadata?.location || '').toLowerCase();
      if (!loc.includes(locationSearch.toLowerCase())) return false;
    }

    if (experienceLevel) {
      const reqExp = (rec.job.analysis?.experienceRequired || '').toLowerCase();
      const diff = (rec.job.analysis?.difficultyScore || '').toLowerCase();
      const val = experienceLevel.toLowerCase();
      if (!reqExp.includes(val) && !diff.includes(val)) return false;
    }

    if (salaryMin) {
      const salText = (rec.job.metadata?.salaryText || rec.job.analysis?.estimatedSalary || '').toLowerCase();
      if (!salText.includes(salaryMin.toLowerCase())) {
        const num = parseInt(salaryMin.replace(/\D/g, ''));
        const salNum = parseInt(salText.replace(/\D/g, ''));
        if (isNaN(num) || isNaN(salNum) || num > salNum) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased flex flex-col">
      <AppHeader />

      <main className="max-w-[1400px] w-full mx-auto px-6 py-8 flex-grow flex flex-col">
        {/* Hub Title Block */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl tracking-tight font-medium text-[#111827] leading-tight">
              AI Matching Hub
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Select a resume profile to rank job openings, evaluate skill compatibility, and generate optimized documents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Active Profile</span>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition focus:outline-none shadow-xs"
            >
              <option value="">-- Choose Profile --</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'recommended'
                ? 'border-gray-950 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            Recommended Jobs
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'advanced'
                ? 'border-gray-950 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            Advanced Compare
          </button>
        </div>

        {/* LOADING STATE */}
        {loadingLibrary ? (
          <div className="py-24 text-center">
            <span className="w-8 h-8 border-3 border-gray-950 border-t-transparent rounded-full animate-spin mx-auto block" />
            <p className="text-xs text-gray-400 mt-3 font-mono">LOADING RECOMMENDATIONS & PLUGINS...</p>
          </div>
        ) : activeTab === 'recommended' ? (
          /* =========================================================================
             RECOMMENDED JOBS TAB
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Filters & List */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Filter Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Min Match</label>
                  <select
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full bg-white border border-gray-100 hover:border-gray-300 text-gray-700 text-xs px-2 py-1 rounded focus:outline-none"
                  >
                    <option value={0}>Any Match</option>
                    <option value={50}>&ge; 50%</option>
                    <option value={70}>&ge; 70%</option>
                    <option value={85}>&ge; 85%</option>
                    <option value={90}>&ge; 90%</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full bg-white border border-gray-100 hover:border-gray-300 text-gray-700 text-xs px-2 py-1 rounded focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Experience</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-white border border-gray-100 hover:border-gray-300 text-gray-700 text-xs px-2 py-1 rounded focus:outline-none"
                  >
                    <option value="">Any Exp</option>
                    <option value="entry">Entry-Level</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior-Level</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Min Salary</label>
                  <input
                    type="text"
                    placeholder="e.g. 120k"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-full bg-white border border-gray-100 hover:border-gray-300 text-gray-700 text-xs px-2 py-1 rounded focus:outline-none"
                  />
                </div>

                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Board Type</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-white border border-gray-100 hover:border-gray-300 text-gray-700 text-xs px-2 py-1 rounded focus:outline-none"
                  >
                    <option value="">Any Platform</option>
                    <option value="greenhouse">Greenhouse</option>
                    <option value="lever">Lever</option>
                    <option value="ashby">Ashby</option>
                    <option value="manual">Manual / Other</option>
                  </select>
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-3">
                {filteredRecommendations.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-xs">
                    No matching recommended jobs found. Try adjusting your filter parameters.
                  </div>
                ) : (
                  filteredRecommendations.map((rec, index) => {
                    const isWorkspaceOpen = workspaceJob?.id === rec.job.id;
                    const hasMatch = rec.match !== null;
                    const isComparingThis = loadingMatchJobId === rec.job.id;

                    // Medals for top 3
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                    return (
                      <div
                        key={rec.job.id}
                        onClick={() => openWorkspace(rec.job, rec.match)}
                        className={`bg-white border text-left p-5 rounded-xl transition duration-150 relative cursor-pointer group hover:shadow-sm ${
                          isWorkspaceOpen ? 'border-gray-950 ring-1 ring-gray-950' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {medal && <span className="text-lg select-none">{medal}</span>}
                              <h3 className="font-bold text-sm text-gray-950 group-hover:text-gray-800 transition">
                                {rec.job.title}
                              </h3>
                              <span className="text-[10px] font-bold text-gray-400 uppercase font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                                {rec.job.sourcePlatform}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 mt-1">{rec.job.company}</p>
                          </div>

                          <div className="text-right flex flex-col items-end gap-2">
                            {hasMatch ? (
                              <div className="flex flex-col items-end">
                                <span className={`text-xl font-black ${
                                  rec.score >= 85 ? 'text-[#19a05f]' :
                                  rec.score >= 70 ? 'text-[#0d7f8c]' :
                                  'text-amber-600'
                                }`}>
                                  {rec.score}%
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Fit Score</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompare(rec.job.id);
                                }}
                                disabled={isComparingThis || !latestVersionId}
                                className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded text-[10px] font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isComparingThis ? (
                                  <>
                                    <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  'Run Analysis'
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Extra inline match helper details */}
                        {hasMatch && rec.match && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="text-[11px] text-gray-500">
                              {rec.match.missingSkillsJson && rec.match.missingSkillsJson.length > 0 ? (
                                <span className="font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                  Missing: {rec.match.missingSkillsJson.slice(0, 3).join(', ')}
                                  {rec.match.missingSkillsJson.length > 3 ? ` +${rec.match.missingSkillsJson.length - 3} more` : ''}
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                                  ✓ All Core Skills Matched
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); openWorkspace(rec.job, rec.match); setWorkspaceTab('apply'); }}
                              className="text-[11px] font-bold bg-gray-950 text-white px-3 py-1 rounded hover:bg-gray-800 transition"
                            >
                              Apply →
                            </button>
                          </div>
                        )}
                        
                        {!hasMatch && (
                          <p className="text-[11px] text-gray-400 mt-2 font-medium italic">
                            Match data not computed yet. Click "Run Analysis" to calculate compatibility scores.
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Job Workspace Drawer */}
            <div className="lg:col-span-5">
              {workspaceJob ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs sticky top-24 max-h-[85vh] overflow-y-auto">
                  
                  {/* Workspace Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">JOB WORKSPACE</span>
                          {workspaceMatch && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              workspaceMatch.overallMatch >= 75 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>{workspaceMatch.overallMatch}% Fit Score</span>
                          )}
                        </div>
                        <h2 className="font-bold text-base text-gray-950 leading-tight">{workspaceJob.title}</h2>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">{workspaceJob.company}</p>
                      </div>
                      <button onClick={closeWorkspace} className="text-gray-400 hover:text-gray-900 p-1 rounded transition flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Workspace Tab Bar */}
                    <div className="flex border-b border-gray-100 mt-4 -mb-px">
                      {(['overview', 'tailor', 'cover', 'apply'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setWorkspaceTab(tab)}
                          className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition border-b-2 ${
                            workspaceTab === tab
                              ? 'border-gray-950 text-gray-950'
                              : 'border-transparent text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          {tab === 'cover' ? 'Cover Letter' : tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="p-5 space-y-5">

                  {/* OVERVIEW TAB */}
                  {workspaceTab === 'overview' && (
                    <div className="space-y-5">
                      {!workspaceMatch ? (
                        <div className="text-center py-12 space-y-3">
                          <p className="text-xs text-gray-400">No match analysis yet for this job.</p>
                          <button
                            onClick={() => handleCompare(workspaceJob.id)}
                            disabled={loadingMatchJobId === workspaceJob.id || !latestVersionId}
                            className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                          >
                            {loadingMatchJobId === workspaceJob.id ? (
                              <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Analyzing...</>
                            ) : 'Run Match Analysis'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'ATS Fit', val: workspaceMatch.atsCoverage },
                              { label: 'Keywords', val: workspaceMatch.keywordCoverage },
                              { label: 'Skills', val: workspaceMatch.skillMatch },
                              { label: 'Experience', val: workspaceMatch.experienceMatch },
                              { label: 'Culture', val: workspaceMatch.cultureMatch },
                              { label: 'Interview', val: workspaceMatch.interviewReadiness },
                            ].map(({ label, val }) => (
                              <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">{label}</p>
                                <p className={`text-base font-black mt-0.5 ${
                                  val >= 75 ? 'text-[#19a05f]' : val >= 55 ? 'text-amber-600' : 'text-red-600'
                                }`}>{val}%</p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                            <div>
                              <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-mono uppercase">Matched Skills ({workspaceMatch.matchedSkillsJson?.length || 0})</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {workspaceMatch.matchedSkillsJson?.map((s, i) => <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded text-[10px] font-mono">{s}</span>)}
                              </div>
                            </div>
                            {workspaceMatch.missingSkillsJson?.length > 0 && (
                              <div className="pt-2 border-t border-gray-100">
                                <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-mono uppercase">Missing Skills ({workspaceMatch.missingSkillsJson.length})</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {workspaceMatch.missingSkillsJson.map((s, i) => <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-mono">{s}</span>)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-2">Strengths</p>
                              <ul className="space-y-1.5">
                                {workspaceMatch.strengthsJson?.slice(0, 3).map((s, i) => <li key={i} className="text-[11px] text-gray-600 flex gap-1.5"><span className="text-green-600 font-bold">•</span>{s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-2">Risks</p>
                              <ul className="space-y-1.5">
                                {workspaceMatch.weaknessesJson?.slice(0, 3).map((w, i) => <li key={i} className="text-[11px] text-gray-600 flex gap-1.5"><span className="text-amber-600 font-bold">•</span>{w}</li>)}
                              </ul>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TAILOR TAB */}
                  {workspaceTab === 'tailor' && (
                    <div className="space-y-4">
                      {tailoring ? (
                        <div className="py-12 text-center space-y-3">
                          <span className="w-7 h-7 border-2 border-gray-950 border-t-transparent rounded-full animate-spin mx-auto block" />
                          <p className="text-[11px] font-bold text-gray-950">AI Tailoring in progress...</p>
                          <p className="text-[9px] text-gray-400 font-mono">{tailorProgress.step} ({tailorProgress.percent}%)</p>
                        </div>
                      ) : tailoredVersion ? (
                        <div className="space-y-4 bg-indigo-950 text-white p-5 rounded-xl">
                          <div className="flex justify-between">
                            <div><h4 className="text-xs font-bold font-mono">Tailored Version Ready</h4><p className="text-[9px] text-indigo-300 font-mono mt-0.5">Saved as child branch</p></div>
                            <span className="text-xl font-bold text-[#10b981]">+{tailoredVersion.diffJson?.atsScoreImprovement || 15}% ATS</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleDownloadPdf(tailoredVersion.id)} className="py-2 bg-white text-indigo-950 font-bold hover:bg-gray-100 rounded text-[10px] transition">Download PDF</button>
                            <a href={`/resumes?selectedVersion=${tailoredVersion.id}`} className="py-2 bg-indigo-800 text-white font-bold hover:bg-indigo-700 rounded text-[10px] transition text-center">Preview</a>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tailorFailed && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center text-[10px] text-red-800">Tailoring failed. Check AI provider keys.</div>}
                          <p className="text-xs text-gray-500 leading-relaxed">Generate a keyword-optimized version of your resume specifically targeting this role's requirements.</p>
                          <button
                            onClick={() => { if (workspaceJob) { setSelectedMatchJob(workspaceJob); handleTailor(workspaceJob.id); } }}
                            className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            Generate Tailored Resume
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* COVER LETTER TAB */}
                  {workspaceTab === 'cover' && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">A cover letter is generated automatically during the Apply pipeline. Tailoring your resume first improves cover letter quality.</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center space-y-3">
                        <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <p className="text-xs text-gray-500">Click <strong>Apply</strong> tab to run the pipeline — a cover letter will be auto-generated and editable before final submission.</p>
                        <button onClick={() => setWorkspaceTab('apply')} className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition">Go to Apply →</button>
                      </div>
                    </div>
                  )}

                  {/* APPLY TAB */}
                  {workspaceTab === 'apply' && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider font-mono">Apply Pipeline</h3>
                        <p className="text-[11px] text-gray-400 mt-1">One click kicks off: resume tailoring → cover letter → packaging → automated submission</p>
                      </div>

                      {/* Error State */}
                      {applyError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
                          <p className="text-xs font-bold text-red-700">Pipeline Failed</p>
                          <p className="text-[11px] text-red-600">{applyError}</p>
                          <button onClick={handleApply} className="px-4 py-1.5 bg-red-700 text-white rounded text-xs font-semibold hover:bg-red-800 transition">Retry</button>
                        </div>
                      )}

                      {/* Active Progress */}
                      {applying && applyProgress && (
                        <div className="bg-gray-950 rounded-xl p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-white">AutoApply Pipeline Active</p>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#10b981] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />LIVE</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-gray-300">{applyProgress.step}</span>
                              <span className="text-white font-bold">{applyProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-700"
                                style={{
                                  width: `${applyProgress.percent}%`,
                                  background: 'linear-gradient(90deg, #10b981, #0d7f8c)'
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Tailoring', done: (applyProgress.percent || 0) > 30 },
                              { label: 'Cover Letter', done: (applyProgress.percent || 0) > 60 },
                              { label: 'Packaging', done: (applyProgress.percent || 0) > 80 },
                            ].map(({ label, done }) => (
                              <div key={label} className={`text-center text-[9px] font-bold font-mono py-1.5 rounded ${
                                done ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-gray-800 text-gray-500'
                              }`}>
                                {done ? '✓ ' : '○ '}{label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ready for Review */}
                      {!applying && applyStatus === 'READY_FOR_REVIEW' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎉</span>
                            <div>
                              <p className="text-xs font-bold text-amber-900">Application Ready for Review</p>
                              <p className="text-[11px] text-amber-700">Resume tailored, cover letter generated. Review then approve to submit.</p>
                            </div>
                          </div>
                          <a href="/applications" className="block w-full text-center py-2.5 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition">Review & Approve in Pipeline →</a>
                        </div>
                      )}

                      {/* Submitted */}
                      {!applying && applyStatus === 'SUBMITTED' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">✅</span>
                            <div>
                              <p className="text-xs font-bold text-green-800">Application Submitted!</p>
                              <p className="text-[11px] text-green-700">Your application has been submitted successfully.</p>
                            </div>
                          </div>
                          <a href="/applications" className="block w-full text-center py-2 bg-green-800 text-white rounded-lg text-xs font-semibold hover:bg-green-900 transition">View in Applications →</a>
                        </div>
                      )}

                      {/* Needs Manual Action */}
                      {!applying && applyStatus === 'NEEDS_MANUAL_ACTION' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⚠️</span>
                            <div>
                              <p className="text-xs font-bold text-red-800">Manual Action Required</p>
                              <p className="text-[11px] text-red-700">The automation could not complete. Visit Applications to resolve.</p>
                            </div>
                          </div>
                          <a href="/applications" className="block w-full text-center py-2 bg-red-800 text-white rounded-lg text-xs font-semibold hover:bg-red-900 transition">Open Applications →</a>
                        </div>
                      )}

                      {/* Initial CTA — not yet applied */}
                      {!applying && !applyStatus && !applyError && (
                        <div className="space-y-4">
                          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Pipeline Steps</p>
                            {[
                              { step: '1. Tailor Resume', desc: 'AI optimizes your resume for this job' },
                              { step: '2. Verify & Audit', desc: 'Anti-fabrication grounding check' },
                              { step: '3. Cover Letter', desc: 'AI writes a custom cover letter' },
                              { step: '4. Package', desc: 'Bundle resume, cover letter, and PDF' },
                              { step: '5. Review Gate', desc: 'You approve before final submission' },
                              { step: '6. Submit', desc: 'Browser automation fills and submits' },
                            ].map(({ step, desc }) => (
                              <div key={step} className="flex gap-2 text-[11px]">
                                <span className="text-gray-950 font-bold w-28 flex-shrink-0">{step}</span>
                                <span className="text-gray-500">{desc}</span>
                              </div>
                            ))}
                          </div>

                          {!latestVersionId && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center text-[11px] text-amber-800">
                              Please select or upload a resume profile first.
                            </div>
                          )}

                          <button
                            onClick={handleApply}
                            disabled={!latestVersionId}
                            className="w-full py-3 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                            Apply Now — Start Pipeline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-24 text-center text-gray-400 text-xs sticky top-24">
                  <span className="text-2xl mb-2 block">👈</span>
                  Click any job card to open its workspace. Analyze compatibility, tailor your resume, and apply in one click.
                </div>
              )}
            </div>

          </div>
        ) : (
          /* =========================================================================
             ADVANCED COMPARE TAB (ORIGINAL SELECTOR DROPDOWNS)
             ========================================================================= */
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Select Resume Profile</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => { setSelectedResumeId(e.target.value); setAdvMatch(null); }}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                >
                  <option value="">-- Choose Profile --</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-center pb-2 text-gray-300 font-bold text-lg select-none">
                &harr;
              </div>
              
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Select Target Job Opening</label>
                <select
                  value={advJobId}
                  onChange={(e) => { setAdvJobId(e.target.value); setAdvMatch(null); }}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                >
                  <option value="">-- Select Job Opening --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.company} &bull; {j.title}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-12">
                <button
                  onClick={() => handleCompare(advJobId, true)}
                  disabled={!selectedResumeId || !advJobId || loadingMatchJobId !== null}
                  className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingMatchJobId === advJobId ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Alignment: {matchProgress.step} ({matchProgress.percent}%)
                    </>
                  ) : (
                    'Evaluate Match Analysis'
                  )}
                </button>
              </div>
            </div>

            {/* Dashboard Panels */}
            {advMatch && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Comparison Analytics */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Match Header Cards */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-bold text-sm text-gray-950">E2E Alignment Score</h3>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Confidence rating {Math.round(advMatch.confidence * 100)}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-gray-950">{advMatch.overallMatch}%</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                          advMatch.overallMatch >= 85 ? 'bg-green-50 text-green-700' :
                          advMatch.overallMatch >= 70 ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {advMatch.interviewProbability} Probability
                        </span>
                      </div>
                    </div>

                    {/* Sub-scores metrics grids */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">ATS Fit</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.atsCoverage}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Keywords</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.keywordCoverage}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Skills Match</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.skillMatch}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Culture Fit</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.cultureMatch}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Experience</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.experienceMatch}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Education</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.educationMatch}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg col-span-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Interview Readiness</span>
                        <p className="text-sm font-bold text-gray-950 mt-0.5">{advMatch.interviewReadiness}%</p>
                      </div>
                    </div>

                    {/* Experience Gap description */}
                    {advMatch.experienceGap && (
                      <div className="space-y-1">
                        <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Experience Gaps Detected</h4>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed bg-amber-50/50 border border-amber-100 p-3 rounded-lg">
                          {advMatch.experienceGap}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Skills side-by-side comparison */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded font-mono uppercase tracking-wider inline-block">Matched Skills ({advMatch.matchedSkillsJson?.length || 0})</h4>
                      <div className="flex flex-wrap gap-1 pt-2">
                        {advMatch.matchedSkillsJson?.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-700 rounded text-xs font-mono">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded font-mono uppercase tracking-wider inline-block">Missing Required Skills ({advMatch.missingSkillsJson?.length || 0})</h4>
                      <div className="flex flex-wrap gap-1 pt-2">
                        {advMatch.missingSkillsJson?.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-mono">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Profile Strengths</h4>
                      <ul className="space-y-2">
                        {advMatch.strengthsJson?.map((str, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed">
                            <span className="text-green-600 font-bold">&bull;</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Profile Risks & Weaknesses</h4>
                      <ul className="space-y-2">
                        {advMatch.weaknessesJson?.map((weak, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed">
                            <span className="text-amber-600 font-bold">&bull;</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Changes list */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
                    <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Recommended Optimization Actions</h4>
                    <div className="space-y-3">
                      {advMatch.recommendedChangesJson?.map((change, idx) => (
                        <div key={idx} className="border border-gray-100 p-3 rounded-lg space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                              change.action === 'ADD_KEYWORD' ? 'bg-red-50 text-red-600' :
                              change.action === 'MOVE_SECTION' ? 'bg-blue-50 text-blue-600' :
                              'bg-gray-100 text-gray-800'
                            }`}>{change.action}</span>
                            <span className="text-[10px] text-gray-400 font-bold font-mono uppercase">{change.target}</span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium">{change.reason}</p>
                          {change.details?.suggestedBullet && (
                            <div className="mt-2 text-[11px] bg-gray-50 border border-gray-100/50 p-2.5 rounded font-sans italic text-gray-600">
                              <strong>Suggestion:</strong> {change.details.suggestedBullet}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: In-Context Tailoring Console */}
                <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-6 shadow-xs sticky top-24 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-gray-950">Tailor Assistant Console</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Use comparison suggestions to generate a targeted resume version.</p>
                  </div>

                  {/* In-progress loader */}
                  {tailoring && (
                    <div className="py-20 text-center space-y-4">
                      <span className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto block" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-950">AI Tailoring Assistant Active...</p>
                        <p className="text-[10px] text-gray-400 max-w-xs mx-auto">{tailorProgress.step} ({tailorProgress.percent}%)</p>
                      </div>
                    </div>
                  )}

                  {/* No Tailored Version yet */}
                  {!tailoring && !tailoredVersion && (
                    <div className="space-y-4">
                      {tailorFailed && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
                          <p className="text-xs font-bold text-red-950">Tailor Assistant Failed</p>
                          <p className="text-[10px] text-red-700 leading-normal">
                            AI Provider is not configured or keys are missing. Verify your settings and ensure keys are set.
                          </p>
                        </div>
                      )}
                      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-xs">
                        <span className="text-2xl mb-2 block">✨</span>
                        Create a tailored version of your resume aligned with this role's profile.
                      </div>
                      <button
                        onClick={() => handleTailor(advJobId)}
                        className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow transition flex items-center justify-center gap-1.5"
                      >
                        Generate Tailored Resume
                      </button>
                    </div>
                  )}

                  {/* Completed Tailoring Dashboard: Diffs & Actions */}
                  {tailoredVersion && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-indigo-950 text-white p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold font-mono">Tailored Version Ready</h4>
                            <p className="text-[10px] text-indigo-200 font-mono mt-0.5">Linked as Child Version Tree</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold font-mono text-[#10b981]">+{tailoredVersion.diffJson?.atsScoreImprovement || 15}%</span>
                            <p className="text-[9px] text-indigo-300 font-mono">ATS Fit Upgrade</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleDownloadPdf(tailoredVersion.id)}
                          className="py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow transition"
                        >
                          Download PDF
                        </button>
                        
                        <a
                          href={`/resumes?selectedVersion=${tailoredVersion.id}`}
                          className="py-2.5 bg-white border border-gray-200 hover:border-gray-950 text-gray-700 hover:text-gray-950 rounded-lg text-xs font-semibold shadow-xs transition text-center"
                        >
                          Preview Resume
                        </a>
                      </div>

                      {tailoredVersion.diffJson?.addedKeywords && tailoredVersion.diffJson.addedKeywords.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Added ATS Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {tailoredVersion.diffJson.addedKeywords.map((kw: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-mono text-[10px]">+{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {tailoredVersion.diffJson?.strengthenedBullets && tailoredVersion.diffJson.strengthenedBullets.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-[9px] text-gray-400 uppercase tracking-wider font-mono">Bullet Point Enhancements</h4>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {tailoredVersion.diffJson.strengthenedBullets.map((bullet: any, idx: number) => (
                              <div key={idx} className="border border-gray-100 rounded-lg p-3 text-[11px] leading-relaxed font-sans space-y-2">
                                <div className="bg-red-50 text-red-800 p-2 rounded border border-red-100 flex items-start gap-1">
                                  <span className="font-mono text-xs font-bold select-none text-red-400">-</span>
                                  <span>{bullet.original}</span>
                                </div>
                                <div className="bg-green-50 text-green-800 p-2 rounded border border-green-100 flex items-start gap-1">
                                  <span className="font-mono text-xs font-bold select-none text-green-400">+</span>
                                  <span>{bullet.updated}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-sans italic mt-1 pl-1">Reason: {bullet.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!advMatch && !loadingMatchJobId && (
              compareFailed ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-16 text-center space-y-4 max-w-2xl mx-auto my-12">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto text-xl font-bold">⚠️</div>
                  <div>
                    <h2 className="text-base font-bold text-red-950">AI Provider Not Configured</h2>
                    <p className="text-xs text-red-700 mt-2 max-w-md mx-auto leading-relaxed">
                      Comparison and match alignment features require a valid API provider key configuration.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCompare(advJobId, true)}
                    className="px-4 py-2 bg-red-900 text-white rounded-lg text-xs font-semibold hover:bg-red-950 transition"
                  >
                    Retry Match Comparison
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-white border border-gray-200 p-24 text-center select-none space-y-4">
                  <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div>
                    <h2 className="text-base font-semibold text-gray-950">Select Resume & Target Job</h2>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Pick a profile and a target job from the dropdowns above and click "Evaluate Match Analysis" to run the comparison engine.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} AutoApply. Matches Hub v1.0.0</p>
      </footer>
    </div>
  );
}
