"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import {
  subscribePomodoroSessions,
  createPomodoroSession,
} from "@/services/pomodoro";
import { notify } from "@/utils/notify";
import { todayKey } from "@/utils/dates";
import { newId } from "@/utils/ids";
import type {
  PomodoroConfig,
  PomodoroLink,
  PomodoroPhase,
  PomodoroPreset,
  PomodoroSession,
} from "@/types/pomodoro";

const CONFIG_KEY = "flowly_pomodoro";
const PRESETS_KEY = "flowly_pomo_presets";
const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  breakMinutes: 5,
  cycles: 4,
};
const DEFAULT_LINK: PomodoroLink = { type: "none", id: null, label: null };

function readConfig(): PomodoroConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function readPresets(): PomodoroPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? (JSON.parse(raw) as PomodoroPreset[]) : [];
  } catch {
    return [];
  }
}

interface PomodoroContextType {
  config: PomodoroConfig;
  phase: PomodoroPhase;
  cycle: number;
  running: boolean;
  remaining: number; // segundos
  totalSeconds: number;
  link: PomodoroLink;
  sessions: PomodoroSession[];
  sessionsLoaded: boolean;
  presets: PomodoroPreset[];
  activeName: string | null;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setConfig: (patch: Partial<PomodoroConfig>) => void;
  applyPreset: (preset: PomodoroConfig & { name?: string }) => void;
  addPreset: (input: PomodoroConfig & { name: string }) => void;
  removePreset: (id: string) => void;
  setLink: (link: PomodoroLink) => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const { settings } = useSettings();

  const [config, setConfigState] = useState<PomodoroConfig>(readConfig);
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [cycle, setCycle] = useState(1);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(config.workMinutes * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [link, setLink] = useState<PomodoroLink>(DEFAULT_LINK);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [presets, setPresets] = useState<PomodoroPreset[]>(readPresets);
  const [activeName, setActiveName] = useState<string | null>(null);

  const totalSeconds =
    (phase === "work" ? config.workMinutes : config.breakMinutes) * 60;

  // refs para el cierre del intervalo
  const ref = useRef({ phase, cycle, config, running, link, uid: user?.uid });
  ref.current = { phase, cycle, config, running, link, uid: user?.uid };
  const notifyOn = settings.notifications;

  // Suscripción a sesiones
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setSessions([]);
      setSessionsLoaded(false);
      return;
    }
    const unsub = subscribePomodoroSessions(
      user.uid,
      (data) => {
        setSessions(data);
        setSessionsLoaded(true);
      },
      (err) => {
        console.error(err);
        setSessionsLoaded(true);
      },
    );
    return () => unsub();
  }, [isLoggedIn, user?.uid]);

  const logSession = useCallback((focusMinutes: number, l: PomodoroLink) => {
    const uid = ref.current.uid;
    if (!uid) return;
    createPomodoroSession(uid, {
      date: todayKey(),
      focusMinutes,
      completedAt: Date.now(),
      linkType: l.type,
      linkId: l.id,
      linkLabel: l.label,
    }).catch((err) => console.error("No se pudo guardar la sesión:", err));
  }, []);

  /** Avanza a la siguiente fase. autoStart = arrancar la nueva fase corriendo. */
  const advance = useCallback(
    (autoStart: boolean) => {
      const { phase: ph, cycle: cy, config: cfg, link: lk } = ref.current;

      if (ph === "work") {
        logSession(cfg.workMinutes, lk);
        if (notifyOn)
          notify(
            "Flowly · Pomodoro",
            "¡Pomodoro completado! Tomate un descanso.",
          );
        const secs = cfg.breakMinutes * 60;
        setPhase("break");
        setRemaining(secs);
        if (autoStart) {
          setEndsAt(Date.now() + secs * 1000);
          setRunning(true);
        } else {
          setEndsAt(null);
          setRunning(false);
        }
      } else {
        // fin de descanso
        if (cy < cfg.cycles) {
          if (notifyOn)
            notify("Flowly · Pomodoro", "Descanso terminado. ¡A enfocar!");
          const secs = cfg.workMinutes * 60;
          setCycle(cy + 1);
          setPhase("work");
          setRemaining(secs);
          if (autoStart) {
            setEndsAt(Date.now() + secs * 1000);
            setRunning(true);
          } else {
            setEndsAt(null);
            setRunning(false);
          }
        } else {
          // completó todos los ciclos
          if (notifyOn)
            notify("Flowly · Pomodoro", "¡Completaste todos los ciclos!");
          setPhase("work");
          setCycle(1);
          setRemaining(cfg.workMinutes * 60);
          setEndsAt(null);
          setRunning(false);
        }
      }
    },
    [logSession, notifyOn],
  );

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Tick
  useEffect(() => {
    if (!running || endsAt == null) return;
    const tick = () => {
      const rem = Math.round((endsAt - Date.now()) / 1000);
      if (rem <= 0) {
        advanceRef.current(true);
      } else {
        setRemaining(rem);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, endsAt]);

  const start = useCallback(() => {
    setRunning(true);
    setEndsAt(Date.now() + remaining * 1000);
  }, [remaining]);

  const pause = useCallback(() => {
    setRunning(false);
    setEndsAt((prev) => {
      if (prev)
        setRemaining(Math.max(0, Math.round((prev - Date.now()) / 1000)));
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setEndsAt(null);
    setPhase("work");
    setCycle(1);
    setRemaining(ref.current.config.workMinutes * 60);
  }, []);

  const skip = useCallback(() => {
    advanceRef.current(ref.current.running);
  }, []);

  const applyConfig = useCallback((patch: Partial<PomodoroConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      } catch {}
      // Si está detenido, reflejar la nueva duración de la fase actual
      if (!ref.current.running) {
        const secs =
          (ref.current.phase === "work"
            ? next.workMinutes
            : next.breakMinutes) * 60;
        setRemaining(secs);
      }
      return next;
    });
  }, []);

  // Edición manual de la config → deja de ser un preset con nombre
  const setConfig = useCallback(
    (patch: Partial<PomodoroConfig>) => {
      applyConfig(patch);
      setActiveName(null);
    },
    [applyConfig],
  );

  const applyPreset = useCallback(
    (preset: PomodoroConfig & { name?: string }) => {
      applyConfig({
        workMinutes: preset.workMinutes,
        breakMinutes: preset.breakMinutes,
        cycles: preset.cycles,
      });
      setActiveName(preset.name ?? null);
    },
    [applyConfig],
  );

  const persistPresets = (next: PomodoroPreset[]) => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
    } catch {}
  };

  const addPreset = useCallback(
    (input: PomodoroConfig & { name: string }) => {
      const preset: PomodoroPreset = { id: newId(), ...input };
      setPresets((prev) => {
        const next = [...prev, preset];
        persistPresets(next);
        return next;
      });
      applyPreset(preset);
    },
    [applyPreset],
  );

  const removePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistPresets(next);
      return next;
    });
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        config,
        phase,
        cycle,
        running,
        remaining,
        totalSeconds,
        link,
        sessions,
        sessionsLoaded,
        presets,
        activeName,
        start,
        pause,
        reset,
        skip,
        setConfig,
        applyPreset,
        addPreset,
        removePreset,
        setLink,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx)
    throw new Error("usePomodoro debe usarse dentro de PomodoroProvider");
  return ctx;
}
