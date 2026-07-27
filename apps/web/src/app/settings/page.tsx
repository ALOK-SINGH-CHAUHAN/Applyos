'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useAuth, AuthProvider } from '../../context/AuthContext';

export default function SettingsPageWrapper() {
  return (
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  );
}

function SettingsPage() {
  const { authHeaders } = useAuth();
  
  // Settings states
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [useMockAi, setUseMockAi] = useState(false);
  
  const [ghUser, setGhUser] = useState('');
  const [ghPass, setGhPass] = useState('');
  const [leverUser, setLeverUser] = useState('');
  const [leverPass, setLeverPass] = useState('');
  const [ashbyUser, setAshbyUser] = useState('');
  const [ashbyPass, setAshbyPass] = useState('');

  const [candidateName, setCandidateName] = useState('Alok Chauhan');
  const [candidateEmail, setCandidateEmail] = useState('seeker@autoapply.dev');
  const [candidatePhone, setCandidatePhone] = useState('+1 555-0199');
  const [candidateLoc, setCandidateLoc] = useState('San Francisco, CA');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/alok-chauhan');
  const [githubUrl, setGithubUrl] = useState('https://github.com/alok-chauhan');
  const [portfolioUrl, setPortfolioUrl] = useState('https://autoapply.dev/alok');
  
  const [concurrency, setConcurrency] = useState('2');
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [saved, setSaved] = useState(false);

  // Job Providers state
  const [providers, setProviders] = useState<any[]>([]);
  const [testingName, setTestingName] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [syncingName, setSyncingName] = useState<string | null>(null);

  useEffect(() => {
    // Load existing settings if saved in localStorage
    if (typeof window !== 'undefined') {
      setGeminiKey(localStorage.getItem('setting_gemini_key') || '••••••••••••••••••••••••••••');
      setGroqKey(localStorage.getItem('setting_groq_key') || '••••••••••••••••••••••••••••');
      setOpenRouterKey(localStorage.getItem('setting_openrouter_key') || '••••••••••••••••••••••••••••');
      setUseMockAi(localStorage.getItem('setting_use_mock_ai') === 'true');
      
      setGhUser(localStorage.getItem('setting_gh_user') || 'alok.chauhan@gmail.com');
      setLeverUser(localStorage.getItem('setting_lever_user') || 'alok.chauhan@gmail.com');
      setAshbyUser(localStorage.getItem('setting_ashby_user') || 'alok.chauhan@gmail.com');
      
      setAutoSubmit(localStorage.getItem('setting_auto_submit') === 'true');
    }
  }, []);

  // Fetch job providers configuration from backend API
  useEffect(() => {
    if (authHeaders) {
      fetch('/api/v1/job-providers', { headers: authHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setProviders(data);
        })
        .catch(err => console.error('Failed to load job providers', err));
    }
  }, [authHeaders]);

  const updateProviderConfig = async (name: string, fields: any) => {
    const updated = providers.map(p => p.name === name ? { ...p, ...fields } : p);
    setProviders(updated);
    
    try {
      const p = updated.find(x => x.name === name);
      await fetch(`/api/v1/job-providers/${name}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: p.enabled,
          credentialsJson: p.credentials,
        }),
      });
    } catch (err) {
      console.error('Failed to update provider configuration:', err);
    }
  };

  const testConnection = async (name: string) => {
    setTestingName(name);
    try {
      const res = await fetch(`/api/v1/job-providers/${name}/test`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [name]: data }));
      
      // Refresh list to pull back newly updated metrics (synced counts/etc.)
      const resList = await fetch('/api/v1/job-providers', { headers: authHeaders() });
      const dataList = await resList.json();
      if (Array.isArray(dataList)) setProviders(dataList);
    } catch (err) {
      setTestResults(prev => ({ ...prev, [name]: { status: 'Failed', details: 'Network timeout error' } }));
    } finally {
      setTestingName(null);
    }
  };

  const syncNow = async (name: string) => {
    setSyncingName(name);
    try {
      await fetch(`/api/v1/job-providers/${name}/sync`, {
        method: 'POST',
        headers: authHeaders(),
      });
      alert(`Sync triggered successfully for ${name.toUpperCase()}! Discovered jobs will populate asynchronously.`);
    } catch (err) {
      alert('Failed to trigger background provider sync.');
    } finally {
      setSyncingName(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_gemini_key', geminiKey);
      localStorage.setItem('setting_groq_key', groqKey);
      localStorage.setItem('setting_openrouter_key', openRouterKey);
      localStorage.setItem('setting_use_mock_ai', String(useMockAi));
      
      localStorage.setItem('setting_gh_user', ghUser);
      localStorage.setItem('setting_lever_user', leverUser);
      localStorage.setItem('setting_ashby_user', ashbyUser);
      
      localStorage.setItem('setting_auto_submit', String(autoSubmit));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased flex flex-col">
      <AppHeader />

      <main className="max-w-[1000px] w-full mx-auto px-6 py-8 flex-grow">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl tracking-tight font-medium text-[#111827] leading-tight">
              Settings & Preferences
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Configure your AI models, automated browser credentials, candidate profiles, and platform behaviors.
            </p>
          </div>
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2 rounded-lg animate-pulse font-mono">
              ✓ CONFIGURATION SAVED
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section 1: AI Providers */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-950">AI Providers & Keys</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure API credentials and mocking behaviors for the matching and parsing engines.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Groq API Key</label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">OpenRouter API Key</label>
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={useMockAi}
                    onChange={(e) => setUseMockAi(e.target.checked)}
                    className="rounded border-gray-300 text-[#0070f3] focus:ring-[#0070f3]"
                  />
                  Enable Dry-Run Offline Mock AI Mode (USE_MOCK_AI)
                </label>
              </div>
            </div>
          </div>

          {/* Section 1.5: Job Providers Console */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-sm text-gray-950">Job Providers Console</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage live job discovery boards, RSS aggregates, and direct company careers crawling.</p>
            </div>

            <div className="space-y-4">
              {providers.map((prov) => {
                const testRes = testResults[prov.name];
                return (
                  <div key={prov.name} className="border border-gray-150 rounded-xl p-5 hover:shadow-sm transition bg-[#fcfdfd]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900 capitalize">{prov.name.replace('_', ' ')}</h4>
                          {prov.enabled ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {prov.supportsAuthentication ? 'Requires provider account authorization credentials.' : 'Public endpoint/crawler listing (no credentials needed).'}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prov.enabled}
                          onChange={(e) => updateProviderConfig(prov.name, { enabled: e.target.checked })}
                          className="rounded border-gray-300 text-[#0070f3] focus:ring-[#0070f3]"
                        />
                        <span className="text-xs font-medium text-gray-600">Enabled</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-gray-100 p-3 rounded-lg text-xs mb-4">
                      <div>
                        <div className="text-gray-400 font-medium">Connection</div>
                        <div className="font-semibold mt-1">
                          {testRes ? (
                            <span className={testRes.status === 'Connected' ? 'text-emerald-600' : 'text-rose-500'}>
                              {testRes.status === 'Connected' ? '✓ Connected' : testRes.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not Configured</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-medium">Boards Synced</div>
                        <div className="font-semibold text-gray-800 mt-1">{prov.boardsSynced}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-medium">Jobs Imported</div>
                        <div className="font-semibold text-gray-800 mt-1">{prov.jobsImported.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-medium">Last Sync</div>
                        <div className="font-semibold text-gray-800 mt-1">
                          {prov.lastSyncAt ? new Date(prov.lastSyncAt).toLocaleTimeString() : 'Never'}
                        </div>
                      </div>
                    </div>

                    {prov.enabled && prov.supportsAuthentication && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">API Key</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••••••••••"
                            value={prov.credentials?.apiKey || ''}
                            onChange={(e) => updateProviderConfig(prov.name, {
                              credentials: { ...prov.credentials, apiKey: e.target.value }
                            })}
                            className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Base URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://api.example.com"
                            value={prov.credentials?.baseUrl || ''}
                            onChange={(e) => updateProviderConfig(prov.name, {
                              credentials: { ...prov.credentials, baseUrl: e.target.value }
                            })}
                            className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {prov.enabled && (
                      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => testConnection(prov.name)}
                          disabled={testingName === prov.name}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-semibold rounded-lg transition"
                        >
                          {testingName === prov.name ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          type="button"
                          onClick={() => syncNow(prov.name)}
                          disabled={syncingName === prov.name}
                          className="px-3 py-1.5 bg-[#0070f3] hover:bg-[#0060df] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                        >
                          {syncingName === prov.name ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Candidate Profile Defaults */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-950">Default Candidate Profile</h3>
              <p className="text-xs text-gray-400 mt-0.5">Primary user details injected into greenhouse/lever/ashby application forms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Full Name</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Email Address</label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Phone Number</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Location</label>
                <input
                  type="text"
                  value={candidateLoc}
                  onChange={(e) => setCandidateLoc(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">GitHub Profile URL</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Portfolio URL</label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Browser Autopilot Credentials */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-950">Browser Credentials</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage encrypted accounts for autofilling boards without manual intervention.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-100 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Greenhouse Auth</span>
                <input
                  type="text"
                  placeholder="Greenhouse Login Email"
                  value={ghUser}
                  onChange={(e) => setGhUser(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={ghPass}
                  onChange={(e) => setGhPass(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="border border-gray-100 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Lever Auth</span>
                <input
                  type="text"
                  placeholder="Lever Login Email"
                  value={leverUser}
                  onChange={(e) => setLeverUser(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={leverPass}
                  onChange={(e) => setLeverPass(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="border border-gray-100 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Ashby Auth</span>
                <input
                  type="text"
                  placeholder="Ashby Login Email"
                  value={ashbyUser}
                  onChange={(e) => setAshbyUser(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={ashbyPass}
                  onChange={(e) => setAshbyPass(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Automation Preferences */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-950">Automation Preferences</h3>
              <p className="text-xs text-gray-400 mt-0.5">Control concurrency levels and submission policies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Max Concurrent Browser Sessions</label>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg text-xs transition focus:outline-none"
                >
                  <option value="1">1 Active Session</option>
                  <option value="2">2 Concurrent Sessions</option>
                  <option value="4">4 Concurrent Sessions</option>
                </select>
              </div>

              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoSubmit}
                    onChange={(e) => setAutoSubmit(e.target.checked)}
                    className="rounded border-gray-300 text-[#0070f3] focus:ring-[#0070f3]"
                  />
                  Allow automated final submission without confirmation dialogs
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              Save Configuration
            </button>
          </div>

        </form>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} AutoApply. Settings Console v1.0.0</p>
      </footer>
    </div>
  );
}
