'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, AuthUser, Role } from '../context/AuthContext';

const ROLE_COLORS: Record<Role, { bg: string; text: string; dot: string }> = {
  OWNER:    { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', dot: '#ef4444' },
  ADMIN:    { bg: 'rgba(249,115,22,0.12)', text: '#f97316', dot: '#f97316' },
  OPERATOR: { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', dot: '#22c55e' },
  VIEWER:   { bg: 'rgba(148,163,184,0.12)',text: '#94a3b8', dot: '#94a3b8' },
};

export function UserRoleSwitcher() {
  const { user, users, switchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const colors = ROLE_COLORS[user.role];

  if (!mounted) return null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <button
        id="role-switcher-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Switch active user role"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(27,27,27,0.12)',
          background: colors.bg,
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'var(--font-inter, Inter, sans-serif)',
          fontWeight: 500,
          color: colors.text,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colors.dot,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span>{user.name}</span>
        {user.email && <span style={{ opacity: 0.6, fontSize: 11 }}>({user.email})</span>}
        <span style={{ opacity: 0.6, fontSize: 11 }}>{user.role}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.5,
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 200,
            background: '#ffffff',
            border: '1px solid rgba(27,27,27,0.1)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'fadeSlideDown 0.12s ease',
          }}
        >
          <div
            style={{
              padding: '8px 12px 6px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              borderBottom: '1px solid rgba(27,27,27,0.07)',
            }}
          >
            Switch User Role
          </div>
          {users.map((u: AuthUser) => {
            const c = ROLE_COLORS[u.role];
            const active = u.id === user.id;
            return (
              <button
                key={u.id}
                id={`role-switch-${u.role.toLowerCase()}`}
                onClick={() => {
                  switchUser(u.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  background: active ? c.bg : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(27,27,27,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c.dot,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1b1b1b' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: c.bg,
                    color: c.text,
                  }}
                >
                  {u.role}
                </span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke={c.dot} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
          <div
            style={{
              padding: '6px 12px 8px',
              fontSize: 10,
              color: '#94a3b8',
              borderTop: '1px solid rgba(27,27,27,0.07)',
            }}
          >
            Sends <code style={{ fontFamily: 'monospace' }}>x-user-id</code> header to API
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
