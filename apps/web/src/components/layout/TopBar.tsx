'use client';

import React from 'react';

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 bg-white border-b border-app-border px-6 gap-4">

      {/* ── Search ── */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search jobs, resumes, applications..."
            className="w-full pl-9 pr-10 py-2 text-sm bg-app-bg border border-app-border rounded-full text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-secondary bg-white border border-app-border rounded px-1 py-0.5">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-app-bg text-secondary hover:text-primary transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-app-bg transition-colors">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            JD
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[13px] font-semibold text-primary leading-tight">John Doe</p>
            <p className="text-[11px] text-secondary leading-tight">Administrator</p>
          </div>
          <svg className="w-4 h-4 text-secondary hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
