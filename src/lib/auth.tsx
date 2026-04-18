import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "qa_admin_creds";
const REMEMBER_KEY = "qa_admin_remember";

type AuthState = {
  creds: string | null;
  login: string | null;
};

type AuthContextValue = AuthState & {
  signIn: (login: string, password: string, remember: boolean) => void;
  signOut: (reason?: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStored(): { creds: string; login: string } | null {
  if (typeof window === "undefined") return null;
  const remember = localStorage.getItem(REMEMBER_KEY) === "1";
  const store = remember ? localStorage : sessionStorage;
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const decoded = atob(raw);
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { creds: raw, login: decoded.slice(0, idx) };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ creds: null, login: null });

  useEffect(() => {
    const stored = readStored();
    if (stored) setState({ creds: stored.creds, login: stored.login });
  }, []);

  const signIn = useCallback((login: string, password: string, remember: boolean) => {
    const creds = btoa(`${login}:${password}`);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "1");
      localStorage.setItem(STORAGE_KEY, creds);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(STORAGE_KEY, creds);
    }
    setState({ creds, login });
  }, []);

  const signOut = useCallback((_reason?: string) => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setState({ creds: null, login: null });
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireCreds() {
  const { creds } = useAuth();
  return creds;
}
