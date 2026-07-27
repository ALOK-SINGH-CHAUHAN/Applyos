'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataJson: Record<string, any>;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

function AuditLogsDashboard() {
  const { authHeaders, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/v1/audit', {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [authHeaders, user]);

  const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN';

  return (
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

      {/* Navigation Bar */}
      <AppHeader />

      {/* Main Console Workspace */}
      <div className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
            Security & Audit Logs
          </h1>
          <p className="text-steel text-sm mt-2">
            Monitor API endpoints execution, credentials rotation, AI generations, and browser autopilot submits.
          </p>
        </div>

        {!isAdmin ? (
          <div className="py-20 text-center bg-marble border border-hairline rounded-card max-w-xl mx-auto w-full space-y-4">
            <svg className="w-12 h-12 text-[#d64545] mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-ink">Access Denied</h2>
            <p className="text-sm text-steel max-w-sm mx-auto">
              You possess {user.role} privileges. Only administrators and owners can review secure workspace audit trails.
            </p>
          </div>
        ) : loading ? (
          <div className="py-20 text-center space-y-4 bg-marble border border-hairline rounded-card">
            <div className="w-8 h-8 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-steel font-mono">Decrypting audit trail...</p>
          </div>
        ) : (
          <div className="bg-marble border border-hairline rounded-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-hairline text-ash uppercase tracking-wider bg-drafting-gray/10">
                    <th className="py-3 px-6 font-bold">Timestamp</th>
                    <th className="py-3 px-6 font-bold">User</th>
                    <th className="py-3 px-6 font-bold">Action</th>
                    <th className="py-3 px-6 font-bold">Target</th>
                    <th className="py-3 px-6 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-drafting-gray/10 transition-colors">
                          <td className="py-4 px-6 text-steel whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-ink">{log.user.name}</div>
                            <div className="text-[10px] text-steel">{log.user.email} · {log.user.role}</div>
                          </td>
                          <td className="py-4 px-6 text-ink font-semibold">
                            {log.action}
                          </td>
                          <td className="py-4 px-6 text-steel">
                            <span className="bg-drafting-gray/50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold mr-1.5">
                              {log.resourceType}
                            </span>
                            <span className="text-[10px]">{log.resourceId}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-[#0d7f8c] font-semibold hover:underline"
                            >
                              {isExpanded ? 'Hide' : 'Expand'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-drafting-gray/20 p-4 border-t border-hairline">
                              <pre className="text-[10px] text-steel font-mono overflow-x-auto whitespace-pre-wrap max-w-[1100px] bg-marble p-4 border border-hairline rounded-panel">
                                {JSON.stringify(log.metadataJson, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-steel">
                        No security logs found in audit index database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Clean clinical footer */}
      <footer className="bg-marble border-t border-hairline py-8 mt-12 text-center text-xs text-ash">
        <p>&copy; {new Date().getFullYear()} AutoApply. Clinical Console v1.0.0</p>
      </footer>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <AuthProvider>
      <AuditLogsDashboard />
    </AuthProvider>
  );
}
