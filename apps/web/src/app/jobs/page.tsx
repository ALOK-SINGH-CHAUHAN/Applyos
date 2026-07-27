'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface JobAnalysis {
  summary: string;
  difficultyScore?: string;
  difficultyReason?: string;
  jobQualityScore?: number;
  jobQualityReason?: string;
  hiringSignals?: string[];
  interviewQuestions?: string[];
  hiddenRequirements?: string[];
  hiringStyle?: string[];
  interviewProcess?: string[];
  hiringInsights?: string[];
  missingExperiences?: string[];
}

interface Job {
  id: string;
  sourcePlatform: string;
  sourceUrl: string;
  company: string;
  title: string;
  descriptionRaw: string;
  status: string;
  scrapedAt: string;
  metadata?: {
    location?: string;
    employmentType?: string;
    salaryText?: string;
  } | null;
  analysis?: JobAnalysis | null;
  keywords?: Array<{ keyword: string; group: string }> | null;
  requirements?: Array<{ name: string; importance: string }> | null;
  benefits?: Array<{ benefit: string }> | null;
  responsibilities?: Array<{ responsibility: string }> | null;
  matches?: Array<{
    overallMatch: number;
    resumeVersionId: string;
    resumeVersion: {
      resume: {
        id: string;
        title: string;
      }
    }
  }>;
}

const queryClient = new QueryClient();

export default function JobsPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <JobsPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function JobsPage() {
  const { authHeaders } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Navigation tab for adding custom jobs
  const [activeImportTab, setActiveImportTab] = useState<'url' | 'description'>('url');
  const [showImportForm, setShowImportForm] = useState(false);

  // Form Inputs
  const [urlInput, setUrlInput] = useState('');
  const [descInput, setDescInput] = useState('');

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Fetch Jobs list
  const { data: jobs = [], isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/v1/jobs', { headers: authHeaders() });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchInterval: (query) => {
      const state = query.state.data;
      if (Array.isArray(state) && state.some((job) => job.status === 'IMPORTING')) {
        return 3000;
      }
      return false;
    },
  });

  // Ingestion Mutation
  const ingestMutation = useMutation({
    mutationFn: async (payload: { url?: string; descriptionRaw?: string }) => {
      const response = await fetch('/api/v1/jobs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Ingestion failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setUrlInput('');
      setDescInput('');
      setShowImportForm(false);
    },
    onError: (err) => {
      alert(`Ingestion failed: ${err.message}`);
    },
  });

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeImportTab === 'url') {
      if (!urlInput.trim()) return;
      ingestMutation.mutate({ url: urlInput });
    } else if (activeImportTab === 'description') {
      if (!descInput.trim()) return;
      ingestMutation.mutate({ descriptionRaw: descInput });
    }
  };

  // Filter jobs based on selected category pill
  const filteredJobs = jobs.filter((job) => {
    if (selectedCategory === 'All') return true;
    
    const loc = (job.metadata?.location || '').toLowerCase();
    const title = job.title.toLowerCase();
    const desc = job.descriptionRaw.toLowerCase();

    if (selectedCategory === 'Remote') {
      return loc.includes('remote');
    }
    if (selectedCategory === 'AI') {
      return title.includes('ai') || desc.includes('artificial intelligence') || desc.includes('openai') || desc.includes('anthropic') || title.includes('prompt');
    }
    if (selectedCategory === 'ML') {
      return title.includes('ml') || title.includes('machine learning') || desc.includes('pytorch') || desc.includes('tensorflow');
    }
    if (selectedCategory === 'Backend') {
      return title.includes('backend') || title.includes('node') || title.includes('python') || title.includes('go') || title.includes('rust');
    }
    if (selectedCategory === 'Full Stack') {
      return title.includes('full stack') || title.includes('fullstack') || title.includes('generalist');
    }
    if (selectedCategory === 'Platform') {
      return title.includes('platform') || title.includes('infrastructure') || title.includes('devops') || title.includes('kubernetes');
    }
    if (selectedCategory === 'Data') {
      return title.includes('data') || title.includes('db') || title.includes('analytics');
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased flex flex-col">
      <AppHeader />

      <main className="max-w-[1400px] w-full mx-auto px-6 py-8 flex-grow flex flex-col">
        {/* Title and Collapsible Trigger */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl tracking-tight font-medium text-[#111827] leading-tight">
              Live Job Feed
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Browse discovered jobs with automatic matching and workspace tailoring.
            </p>
          </div>
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="px-4 py-2 border border-gray-200 hover:border-gray-900 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold tracking-wide transition shadow-sm"
          >
            {showImportForm ? '✕ Hide Import Panel' : '＋ Import Custom Job'}
          </button>
        </div>

        {/* Collapsible Custom Ingest Form */}
        {showImportForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm space-y-4">
            <div className="flex gap-4 border-b border-gray-100 pb-2">
              {(['url', 'description'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveImportTab(tab)}
                  className={`pb-2 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition ${
                    activeImportTab === tab ? 'border-gray-950 text-gray-950' : 'border-transparent text-gray-400'
                  }`}
                >
                  {tab === 'url' ? 'Import from URL' : 'Paste Job Description'}
                </button>
              ))}
            </div>

            <form onSubmit={handleIngest} className="space-y-4">
              {activeImportTab === 'url' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Job Board Posting Link</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://boards.greenhouse.io/openai/jobs/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-grow border border-gray-200 px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-950"
                    />
                    <button
                      type="submit"
                      disabled={ingestMutation.isPending}
                      className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {ingestMutation.isPending ? 'Scraping...' : 'Ingest Link'}
                    </button>
                  </div>
                </div>
              )}

              {activeImportTab === 'description' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Raw Markdown / Plaintext Description</label>
                  <textarea
                    rows={6}
                    placeholder="We are looking for a Senior AI Engineer..."
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                  <button
                    type="submit"
                    disabled={ingestMutation.isPending}
                    className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {ingestMutation.isPending ? 'Analyzing...' : 'Parse Description'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {['All', 'Remote', 'AI', 'ML', 'Backend', 'Full Stack', 'Platform', 'Data'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold font-mono tracking-wide transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-gray-950 border-gray-950 text-white'
                  : 'bg-white border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Feed List */}
        {loadingJobs ? (
          <div className="bg-white rounded-xl border border-gray-200 p-24 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-mono">Scanning live discovery boards...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-24 text-center select-none space-y-4">
            <p className="text-xs text-gray-500">No jobs found matching "{selectedCategory}" in the live feed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              // Find best match score
              const bestMatch = job.matches && job.matches.length > 0 
                ? [...job.matches].sort((a, b) => b.overallMatch - a.overallMatch)[0] 
                : null;

              return (
                <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-900 transition-colors">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">{job.company}</span>
                        <h3 className="font-bold text-base text-gray-900 leading-tight mt-0.5">{job.title}</h3>
                      </div>
                      
                      {job.status === 'IMPORTING' ? (
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-600 text-[9px] font-bold font-mono tracking-wider animate-pulse rounded uppercase shrink-0">
                          Analyzing...
                        </span>
                      ) : bestMatch ? (
                        <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-extrabold rounded-lg font-mono shrink-0">
                          {bestMatch.overallMatch}% Match
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-150 text-gray-400 text-[9px] font-medium font-mono rounded uppercase shrink-0">
                          No Match
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>📍 {job.metadata?.location || 'Remote'}</span>
                      <span>💰 {job.metadata?.salaryText || 'Market Rate'}</span>
                      <span className="capitalize">🔗 {job.sourcePlatform}</span>
                    </div>

                    {bestMatch && (
                      <p className="text-[10px] text-gray-400 font-mono">
                        Best Fit: <span className="text-gray-700 font-semibold">{bestMatch.resumeVersion.resume.title}</span>
                      </p>
                    )}

                    {job.analysis?.summary && (
                      <p className="text-xs text-gray-650 line-clamp-2 leading-relaxed pt-1">
                        {job.analysis.summary}
                      </p>
                    )}
                  </div>

                  {/* Actions Drawer Triggers */}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                    {bestMatch ? (
                      <>
                        <button
                          onClick={() => router.push(`/resumes?resumeId=${bestMatch.resumeVersion.resume.id}&workspaceJobId=${job.id}`)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-950 font-mono transition"
                        >
                          Workspace &rarr;
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/resumes?resumeId=${bestMatch.resumeVersion.resume.id}&workspaceJobId=${job.id}&tab=tailor`)}
                            className="px-3 py-1.5 border border-gray-200 hover:border-gray-900 bg-white text-gray-700 rounded-lg text-xs font-semibold transition"
                          >
                            Tailor
                          </button>
                          <button
                            onClick={() => router.push(`/resumes?resumeId=${bestMatch.resumeVersion.resume.id}&workspaceJobId=${job.id}&tab=apply`)}
                            className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Apply Now
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic font-mono">Upload a resume to unlock auto-matching workflows.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
