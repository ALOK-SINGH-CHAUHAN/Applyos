import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '240px' }}>
        <TopBar />

        {/* Page header */}
        {(title || subtitle) && (
          <div className="px-7 pt-6 pb-0">
            {title && (
              <h1 className="text-2xl font-semibold text-primary leading-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
        )}

        {/* Page body */}
        <main className="flex-1 px-7 py-5">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-7 py-4 border-t border-app-border text-xs text-secondary flex items-center justify-between">
          <span>© 2025 AI Auto Job Bid Bot. All rights reserved.</span>
          <div className="flex gap-4">
            <button className="hover:text-primary transition-colors">Privacy Policy</button>
            <button className="hover:text-primary transition-colors">Terms of Service</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
