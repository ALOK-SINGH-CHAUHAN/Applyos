'use client';

/**
 * AuthContext
 *
 * Provides a lightweight client-side auth context for simulating different
 * roles. The selected "user" is stored in localStorage and its ID is injected
 * as the `x-user-id` header into all fetch calls via a global fetch wrapper.
 *
 * Roles map to seed users created by prisma/seed.ts:
 *   owner    → user-owner-seed
 *   admin    → user-admin-seed
 *   operator → user-operator-seed
 *   viewer   → user-viewer-seed
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Role = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const SEED_USERS: AuthUser[] = [
  { id: 'user-owner-seed',    name: 'Owner',    email: 'owner@autoapply.ai',    role: 'OWNER' },
  { id: 'user-admin-seed',    name: 'Admin',    email: 'admin@autoapply.ai',    role: 'ADMIN' },
  { id: 'user-operator-seed', name: 'Operator', email: 'operator@autoapply.ai', role: 'OPERATOR' },
  { id: 'user-viewer-seed',   name: 'Viewer',   email: 'viewer@autoapply.ai',   role: 'VIEWER' },
];

const LS_KEY = 'autoapply_active_user_id';
const LS_TOKEN_KEY = 'autoapply_active_user_jwt';
const LS_GOOGLE_USER_KEY = 'autoapply_google_user';

interface AuthContextValue {
  user: AuthUser;
  users: AuthUser[];
  token: string;
  switchUser: (id: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  /** Returns headers object with Authorization Bearer token */
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_GOOGLE_USER_KEY);
      try {
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_KEY) ?? SEED_USERS[2].id; // default: operator
    }
    return SEED_USERS[2].id;
  });

  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_TOKEN_KEY) ?? '';
    }
    return '';
  });

  // If googleUser is logged in, use it; otherwise use the active seed user
  const user = googleUser ?? (SEED_USERS.find((u) => u.id === activeId) ?? SEED_USERS[2]);

  const fetchToken = useCallback(async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_TOKEN_KEY, data.token);
        }
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to exchange token:', err);
    }
  }, []);

  // Fetch token on mount if not present and not signed in with Google
  useEffect(() => {
    if (!token && !googleUser) {
      fetchToken(user.id, user.role);
    }
  }, [token, googleUser, user.id, user.role, fetchToken]);

  const switchUser = useCallback(async (id: string) => {
    const targetUser = SEED_USERS.find((u) => u.id === id) ?? SEED_USERS[2];
    setGoogleUser(null);
    setActiveId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, id);
      localStorage.removeItem(LS_GOOGLE_USER_KEY);
    }
    await fetchToken(targetUser.id, targetUser.role);
  }, [fetchToken]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to authenticate with Google');
      }
      const data = await res.json();
      setToken(data.token);
      setGoogleUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_TOKEN_KEY, data.token);
        localStorage.setItem(LS_GOOGLE_USER_KEY, JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('[AuthProvider] Google sign-in failed:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setGoogleUser(null);
    setToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_GOOGLE_USER_KEY);
    }
    // Revert back to the default dev operator role
    const defaultUser = SEED_USERS[2];
    setActiveId(defaultUser.id);
    fetchToken(defaultUser.id, defaultUser.role);
  }, [fetchToken]);

  const authHeaders = useCallback(() => {
    return {
      'x-user-id': user.id,
      'Authorization': `Bearer ${token}`,
    };
  }, [user.id, token]);

  return (
    <AuthContext.Provider value={{ user, users: SEED_USERS, token, switchUser, loginWithGoogle, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: SEED_USERS[2],
      users: SEED_USERS,
      token: '',
      switchUser: async () => {},
      loginWithGoogle: async () => {},
      logout: () => {},
      authHeaders: () => ({ 'x-user-id': SEED_USERS[2].id }),
    };
  }
  return context;
}

export { SEED_USERS };

