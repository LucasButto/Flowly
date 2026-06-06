import type { Weekday } from "./common";

export type RoutineFrequency = "daily" | "weekdays" | "custom";

export type RoutineStatus = "pending" | "completed" | "skipped";

export interface Routine {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  days: Weekday[];
  frequency: RoutineFrequency;
  tag: string;
  description: string;
  color: string; // hex
  createdAt: number;
  updatedAt: number;
}

/** Datos del formulario antes de persistir (sin metadatos). */
export type RoutineInput = Omit<Routine, "id" | "createdAt" | "updatedAt">;

/** Registro de estado de una rutina en un día concreto. */
export interface RoutineLog {
  id: string; // `${routineId}_${YYYY-MM-DD}`
  routineId: string;
  date: string; // "YYYY-MM-DD"
  status: RoutineStatus;
  updatedAt: number;
}

export interface RoutineStats {
  completed: number;
  skipped: number;
  currentStreak: number;
  bestStreak: number;
  completionRate: number; // 0–100
}
