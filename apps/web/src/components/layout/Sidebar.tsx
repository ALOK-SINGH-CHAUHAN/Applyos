'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Icons ────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  resumes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  jobs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  applications: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  automation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  aitools: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  logs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  integrations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  zap: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  crown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20M5 20V9l7-5 7 5v11" />
    </svg>
  ),
};

// ── Nav Items ─────────────────────────────────────────────────────────
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/resumes', label: 'Resumes', icon: 'resumes' },
  { href: '/jobs', label: 'Jobs', icon: 'jobs' },
  { href: '/applications', label: 'Applications', icon: 'applications' },
  { href: '/automation', label: 'Automation', icon: 'automation' },
  { href: '/ai-tools', label: 'AI Tools', icon: 'aitools' },
  { href: '/analytics', label: 'Reports', icon: 'reports' },
  { href: '/audit', label: 'Logs', icon: 'logs' },
  { href: '/integrations', label: 'Integrations', icon: 'integrations' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const;

type IconKey = keyof typeof icons;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30 overflow-y-auto"
      style={{ backgroundColor: '#0E1130' }}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1A1F45]">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#5B4FE9' }}>
          <div className="text-white">
            {icons.zap}
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-[13px] leading-tight">AI Auto</p>
          <p className="text-[#9CA3C4] text-[11px] leading-tight">Job Bid Bot</p>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-[#9CA3C4] hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { backgroundColor: '#5B4FE9' } : {}}
            >
              <span className={isActive ? 'text-white' : 'text-[#9CA3C4]'}>
                {icons[item.icon as IconKey]}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Quick Actions ── */}
      <div className="px-3 py-4 border-t border-[#1A1F45]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3C4] px-3 mb-2.5">
          Quick Actions
        </p>
        <div className="space-y-1.5">
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-[#9CA3C4] border border-[#1A1F45] hover:border-[#5B4FE9]/40 hover:text-white transition-all">
            {icons.upload}
            Upload Resume
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-[#9CA3C4] border border-[#1A1F45] hover:border-[#5B4FE9]/40 hover:text-white transition-all">
            {icons.plus}
            Add Job URL
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ backgroundColor: '#5B4FE9' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5A4BD4')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5B4FE9')}>
            {icons.play}
            Start Automation
          </button>
        </div>
      </div>

      {/* ── Promo Card ── */}
      <div className="mx-3 mb-4 rounded-xl p-4"
        style={{ background: 'linear-gradient(135deg, #5B4FE9 0%, #7C3AED 100%)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold text-[13px]">Pro Plan</span>
          <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Upgrade
          </span>
        </div>
        <p className="text-white/70 text-[11px] leading-relaxed">
          Thousand of applications.<br />Unlimited opportunities.
        </p>
      </div>
    </aside>
  );
}
