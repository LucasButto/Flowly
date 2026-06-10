"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import {
  subscribeRoutines,
  subscribeRoutineLogs,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  setRoutineLog,
  clearRoutineLog,
} from "@/services/routines";
import {
  computeRoutineStats,
  isRoutineActive,
  type StatusLookup,
} from "@/utils/routineStats";
import { todayKey } from "@/utils/dates";
import type {
  Routine,
  RoutineInput,
  RoutineLog,
  RoutineStatus,
  RoutineStats,
} from "@/types/routine";

interface RoutinesContextType {
  routines: Routine[];
  logs: RoutineLog[];
  loaded: boolean;
  getStatus: StatusLookup;
  statsOf: (routine: Routine) => RoutineStats;
  addRoutine: (input: RoutineInput) => Promise<void>;
  editRoutine: (id: string, patch: Partial<RoutineInput>) => Promise<void>;
  removeRoutine: (id: string) => Promise<void>;
  setStatus: (
    routineId: string,
    date: string,
    status: RoutineStatus,
  ) => Promise<void>;
  /** Pausa o reanuda una rutina (los días pausados no afectan rachas). */
  toggleActive: (routine: Routine) => Promise<void>;
}

const RoutinesContext = createContext<RoutinesContextType | null>(null);

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setRoutines([]);
      setLogs([]);
      setLoaded(false);
      return;
    }
    const uid = user.uid;
    setLoaded(false);
    let gotRoutines = false;
    let gotLogs = false;
    const maybeLoaded = () => {
      if (gotRoutines && gotLogs) setLoaded(true);
    };

    const unsubR = subscribeRoutines(
      uid,
      (data) => {
        setRoutines(data);
        gotRoutines = true;
        maybeLoaded();
      },
      (err) => {
        console.error(err);
        toast("No se pudieron cargar las rutinas", "error");
        setLoaded(true);
      },
    );
    const unsubL = subscribeRoutineLogs(
      uid,
      (data) => {
        setLogs(data);
        gotLogs = true;
        maybeLoaded();
      },
      (err) => console.error(err),
    );

    return () => {
      unsubR();
      unsubL();
    };
  }, [isLoggedIn, user?.uid, toast]);

  const statusMap = useMemo(() => {
    const m = new Map<string, RoutineStatus>();
    for (const log of logs) m.set(`${log.routineId}_${log.date}`, log.status);
    return m;
  }, [logs]);

  const getStatus = useCallback<StatusLookup>(
    (routineId, key) => statusMap.get(`${routineId}_${key}`) ?? "pending",
    [statusMap],
  );

  const statsOf = useCallback(
    (routine: Routine) => computeRoutineStats(routine, getStatus),
    [getStatus],
  );

  const addRoutine = useCallback(
    async (input: RoutineInput) => {
      if (!user?.uid) return;
      try {
        await createRoutine(user.uid, input);
      } catch (err) {
        console.error(err);
        toast("No se pudo crear la rutina", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const editRoutine = useCallback(
    async (id: string, patch: Partial<RoutineInput>) => {
      if (!user?.uid) return;
      try {
        await updateRoutine(user.uid, id, patch);
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la rutina", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const removeRoutine = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteRoutine(user.uid, id);
      } catch (err) {
        console.error(err);
        toast("No se pudo eliminar la rutina", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const setStatus = useCallback(
    async (routineId: string, date: string, status: RoutineStatus) => {
      if (!user?.uid) return;
      try {
        if (status === "pending") {
          await clearRoutineLog(user.uid, routineId, date);
        } else {
          await setRoutineLog(user.uid, routineId, date, status);
        }
      } catch (err) {
        console.error(err);
        toast("No se pudo guardar el estado", "error");
      }
    },
    [user?.uid, toast],
  );

  const toggleActive = useCallback(
    async (routine: Routine) => {
      if (!user?.uid) return;
      const today = todayKey();
      const pauses = routine.pauses ?? [];
      try {
        if (isRoutineActive(routine)) {
          // Pausar: abre un rango de pausa desde hoy
          await updateRoutine(user.uid, routine.id, {
            active: false,
            pauses: [...pauses, { from: today, to: null }],
          });
        } else {
          // Reanudar: cierra la pausa abierta (hoy vuelve a contar)
          await updateRoutine(user.uid, routine.id, {
            active: true,
            pauses: pauses.map((p) => (p.to === null ? { ...p, to: today } : p)),
          });
        }
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la rutina", "error");
      }
    },
    [user?.uid, toast],
  );

  return (
    <RoutinesContext.Provider
      value={{
        routines,
        logs,
        loaded,
        getStatus,
        statsOf,
        addRoutine,
        editRoutine,
        removeRoutine,
        setStatus,
        toggleActive,
      }}
    >
      {children}
    </RoutinesContext.Provider>
  );
}

export function useRoutines() {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error("useRoutines debe usarse dentro de RoutinesProvider");
  return ctx;
}
