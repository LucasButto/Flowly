"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "./AuthContext";

export type ThemePref = "light" | "dark" | "system";

export interface Settings {
  theme: ThemePref;
  timezone: string;
  notifications: boolean;
}

const STORAGE_KEY = "flowly_settings";

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const DEFAULTS: Settings = {
  theme: "system",
  timezone: detectTimezone(),
  notifications: false,
};

function readLocal(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

function applyTheme(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", resolved);
  // Cookie leída por el layout (server) para pintar el tema correcto sin flash
  document.cookie = `flowly_theme=${resolved}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface SettingsContextType {
  settings: Settings;
  resolvedTheme: "light" | "dark";
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [settings, setSettings] = useState<Settings>(readLocal);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveTheme(readLocal().theme),
  );
  const loadedForRef = useRef<string | null>(null);

  // Aplicar tema + reaccionar a cambios del SO cuando es "system"
  useEffect(() => {
    applyTheme(settings.theme);
    setResolvedTheme(resolveTheme(settings.theme));

    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setResolvedTheme(resolveTheme("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.theme]);

  // Cargar settings desde Firestore al iniciar sesión
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      loadedForRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        const remote = snap.exists()
          ? (snap.data().settings as Partial<Settings> | undefined)
          : undefined;
        if (remote) {
          setSettings((prev) => {
            const merged = { ...prev, ...remote };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
        loadedForRef.current = user.uid;
      } catch (err) {
        console.error("No se pudieron cargar las preferencias:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.uid]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        if (isLoggedIn && user?.uid && loadedForRef.current === user.uid) {
          setDoc(
            doc(db, "users", user.uid),
            { settings: next },
            { merge: true },
          ).catch((err) =>
            console.error("No se pudieron guardar las preferencias:", err),
          );
        }
        return next;
      });
    },
    [isLoggedIn, user?.uid],
  );

  return (
    <SettingsContext.Provider
      value={{ settings, resolvedTheme, updateSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings debe usarse dentro de SettingsProvider");
  return ctx;
}
