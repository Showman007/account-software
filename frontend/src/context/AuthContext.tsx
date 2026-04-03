import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth.ts';
import * as authApi from '../api/auth.ts';
import { useIdleTimeout } from '../hooks/useIdleTimeout.ts';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi
        .getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    localStorage.setItem('last_active_at', Date.now().toString());
    setUser(u);
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const u = await authApi.googleLogin(credential);
    localStorage.setItem('last_active_at', Date.now().toString());
    setUser(u);
  }, []);

  const register = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      const u = await authApi.register(email, password, passwordConfirmation);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('last_active_at');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Auto-logout after 1 hour of inactivity
  const idleLogoutRef = useRef(() => {});
  idleLogoutRef.current = () => {
    if (isAuthenticated) {
      toast.warn('Session expired due to inactivity. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('last_active_at');
      setUser(null);
      window.location.href = '/login';
    }
  };
  useIdleTimeout(60 * 60 * 1000, () => idleLogoutRef.current(), isAuthenticated);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, loading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
