"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Participant } from "./types";

const STORAGE_KEY = "secret-santa-current-participant";

export interface AuthState {
  participant: Participant | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (participant: Participant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Participant = JSON.parse(stored);
        setParticipant(parsed);
      }
    } catch {
      // If localStorage is not available or JSON is invalid, we just ignore it.
      // TODO: Optionally report this error to an error tracking service.
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((p: Participant) => {
    setParticipant(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // TODO: Optionally handle localStorage write failures (e.g. quota exceeded).
    }
  }, []);

  const logout = useCallback(() => {
    setParticipant(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ participant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


