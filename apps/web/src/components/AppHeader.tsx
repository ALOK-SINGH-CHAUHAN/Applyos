'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRoleSwitcher } from './UserRoleSwitcher';
import { useAuth } from '../context/AuthContext';

const USER_LINKS = [
  { href: '/resumes',              label: 'Resumes' },
  { href: '/analytics',            label: 'Analytics' },
  { href: '/settings',             label: 'Settings' },
];

const DEV_LINKS: Array<{ href: string; label: string }> = [];

export function AppHeader() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-200 h-16 z-40">
      <div className="max-w-[1400px] h-full mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/resumes" className="flex items-center gap-2.5 group">
            <svg width="20" height="20" className="w-5 h-5 text-gray-950 transition-transform group-hover:rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="font-semibold text-lg tracking-tight text-gray-950">AutoApply</span>
          </Link>

          {mounted && (
            <nav className="hidden md:flex items-center gap-6">
              {USER_LINKS.map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs font-semibold pb-1 border-b-2 transition-all duration-150 ${
                      active 
                        ? 'border-gray-950 text-gray-950' 
                        : 'border-transparent text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#0d7f8c] bg-[#e6f8f5] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19a05f] animate-pulse" />
            INTELLIGENCE ACTIVE
          </span>

          <UserRoleSwitcher />

          {mounted && (
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-pill text-[10px] font-bold text-gray-600 hover:text-gray-900 transition font-mono"
            >
              SIGN OUT
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

