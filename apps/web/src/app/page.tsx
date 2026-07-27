'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from '../context/AuthContext';

export default function HomePage() {
  return (
    <AuthProvider>
      <HomePageContent />
    </AuthProvider>
  );
}

function HomePageContent() {
  const { loginWithGoogle, user } = useAuth();
  const [googleClientReady, setGoogleClientReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Load the Google Sign-in client library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (clientId && (window as any).google) {
        setGoogleClientReady(true);
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: async (response: any) => {
            try {
              await loginWithGoogle(response.credential);
              window.location.href = '/resumes';
            } catch (err) {
              console.error(err);
              alert('Failed to login with Google: ' + (err instanceof Error ? err.message : String(err)));
            }
          },
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn-header'),
          { theme: 'outline', size: 'medium', shape: 'pill' }
        );
        const heroBtn = document.getElementById('google-signin-btn-hero');
        if (heroBtn) {
          (window as any).google.accounts.id.renderButton(
            heroBtn,
            { theme: 'filled_black', size: 'large', shape: 'pill' }
          );
        }
        (window as any).google.accounts.id.prompt(); // Prompt One Tap if supported
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Safe check if element already removed
      }
    };
  }, [clientId, loginWithGoogle]);

  const handleMockGoogleLogin = () => {
    // Fallback Mock Sign-in for local dev
    localStorage.setItem('autoapply_active_user_id', 'user-operator-seed');
    window.location.href = '/resumes';
  };

  return (
    <div className="min-h-screen bg-drafting-gray text-ink font-sans antialiased flex flex-col">
      {/* Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-[#19a05f] to-[#0d7f8c] py-2.5 px-4 text-center z-50">
        <p className="text-sm font-medium text-white">
          AutoApply Autopilot is now in public beta.{' '}
          <a href="/resumes" className="underline underline-offset-2 hover:text-white/80 transition-colors ml-1 inline-flex items-center gap-0.5">
            Read the announcement <span className="text-xs">→</span>
          </a>
        </p>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 w-full bg-marble/95 backdrop-blur border-b border-hairline h-16 z-40 transition-shadow">
        <div className="max-w-[1200px] h-full mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <svg width="20" height="20" className="w-5 h-5 text-ink transition-transform group-hover:rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="font-semibold text-lg tracking-tight text-ink">AutoApply</span>
          </a>

          {/* Right Actions - Google Login Button Only */}
          <div className="flex items-center gap-4">
            {clientId ? (
              <div id="google-signin-btn-header" className="min-h-[36px]" />
            ) : (
              <button 
                onClick={handleMockGoogleLogin}
                className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-pill text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.12.75-2.55 1.19-3.95 1.19-3.05 0-5.63-2.06-6.55-4.83H1.31v3.23A12 12 0 0 0 12 24z"/>
                  <path fill="#FBBC05" d="M5.45 14.32a7.18 7.18 0 0 1 0-4.64V6.45H1.31a12 12 0 0 0 0 11.1l4.14-3.23z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.31 6.45l4.14 3.23c.92-2.77 3.5-4.83 6.69-4.83z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Hero Left */}
          <div className="flex flex-col items-start text-left">
            <h1 className="text-5xl md:text-display tracking-display font-semibold text-ink leading-[1.05] mb-6">
              Tailor Resumes. <br/>
              <span className="text-steel">Automate Search.</span>
            </h1>
            <p className="text-lg md:text-subheading text-steel leading-relaxed mb-8 max-w-lg">
              AutoApply is a clinical job search cockpit. Ingest resumes, auto-tailor alignments, and deploy autopilot applications with zero credential fabrication.
            </p>
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              {clientId ? (
                <div id="google-signin-btn-hero" className="min-h-[44px]" />
              ) : (
                <button
                  onClick={handleMockGoogleLogin}
                  className="w-full sm:w-auto text-center px-6 py-3.5 bg-ink text-marble rounded-button shadow-lg text-sm font-medium hover:bg-opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Hero Right: Product Preview Panel */}
          <div className="relative">
            <div className="w-full bg-marble rounded-card border border-hairline p-5 shadow-lg select-none">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-xs text-ash font-mono ml-2">console.autoapply.dev</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mint-signal animate-pulse" />
                  <span className="text-xs font-semibold text-ink font-mono">AUTOPILOT: ACTIVE</span>
                </div>
              </div>

              {/* Mockup Body */}
              <div className="flex gap-4">
                {/* Mockup Sidebar */}
                <div className="w-1/4 pr-3 border-r border-hairline space-y-3">
                  <div className="px-2 py-1 bg-drafting-gray rounded-button text-xs font-semibold text-ink font-mono">Overview</div>
                  <div className="px-2 py-1 rounded-button text-xs font-medium text-steel hover:bg-drafting-gray/50 transition-colors font-mono">Resumes</div>
                  <div className="px-2 py-1 rounded-button text-xs font-medium text-steel hover:bg-drafting-gray/50 transition-colors font-mono">Job Matcher</div>
                  <div className="px-2 py-1 rounded-button text-xs font-medium text-steel hover:bg-drafting-gray/50 transition-colors font-mono">Autopilot</div>
                  <div className="px-2 py-1 rounded-button text-xs font-medium text-steel hover:bg-drafting-gray/50 transition-colors font-mono">Logs & Audits</div>
                  <div className="px-2 py-1 rounded-button text-xs font-medium text-steel hover:bg-drafting-gray/50 transition-colors font-mono">Settings</div>
                </div>

                {/* Mockup Content */}
                <div className="flex-1 space-y-4">
                  {/* Grid of Mini metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-hairline p-3 rounded-panel">
                      <p className="text-[10px] uppercase tracking-wider text-ash font-semibold">Average Match</p>
                      <h4 className="text-lg font-bold text-ink font-mono mt-1">94.2%</h4>
                      {/* Mini line chart */}
                      <div className="h-6 flex items-end gap-1 mt-2">
                        <div className="w-full bg-mint-signal/20 rounded-[1px]" style={{ height: '35%' }} />
                        <div className="w-full bg-mint-signal/40 rounded-[1px]" style={{ height: '55%' }} />
                        <div className="w-full bg-mint-signal/30 rounded-[1px]" style={{ height: '45%' }} />
                        <div className="w-full bg-mint-signal/60 rounded-[1px]" style={{ height: '70%' }} />
                        <div className="w-full bg-mint-signal/80 rounded-[1px]" style={{ height: '65%' }} />
                        <div className="w-full bg-mint-signal rounded-[1px]" style={{ height: '90%' }} />
                      </div>
                    </div>
                    <div className="border border-hairline p-3 rounded-panel">
                      <p className="text-[10px] uppercase tracking-wider text-ash font-semibold">Success Rate</p>
                      <h4 className="text-lg font-bold text-ink font-mono mt-1">98.7%</h4>
                      {/* Mini bar chart */}
                      <div className="h-6 flex items-end gap-1 mt-2">
                        <div className="w-full bg-sky/20 rounded-[1px]" style={{ height: '60%' }} />
                        <div className="w-full bg-sky/40 rounded-[1px]" style={{ height: '75%' }} />
                        <div className="w-full bg-moss/60 rounded-[1px]" style={{ height: '80%' }} />
                        <div className="w-full bg-sky/70 rounded-[1px]" style={{ height: '65%' }} />
                        <div className="w-full bg-moss/80 rounded-[1px]" style={{ height: '85%' }} />
                        <div className="w-full bg-moss rounded-[1px]" style={{ height: '95%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Feed */}
                  <div className="border border-hairline p-3 rounded-panel space-y-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ash font-semibold border-b border-hairline pb-1">Live Autopilot Logs</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-ink truncate max-w-[150px]">Senior React Dev @ Stripe</span>
                      <span className="px-1.5 py-0.5 bg-[#e7f6ed] text-[#19a05f] text-[9px] font-semibold rounded-pill font-mono">SUBMITTED (98%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-ink truncate max-w-[150px]">Staff Engineer @ Vercel</span>
                      <span className="px-1.5 py-0.5 bg-[#e7f6ed] text-[#19a05f] text-[9px] font-semibold rounded-pill font-mono">SUBMITTED (94%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-ink truncate max-w-[150px]">Frontend Architect @ Linear</span>
                      <span className="px-1.5 py-0.5 bg-[#e0f7ff] text-[#00b9f1] text-[9px] font-semibold rounded-pill font-mono animate-pulse">TAILORING...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-marble border-t border-hairline py-12 mt-auto">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <svg width="20" height="20" className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="font-semibold text-lg tracking-tight text-ink">AutoApply</span>
            </div>
            <p className="text-steel text-xs">
              © {new Date().getFullYear()} AutoApply. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
