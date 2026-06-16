import { occurrencesInRange } from "./events";
import { routineRunsOn, isRoutinePausedOn } from "./routineStats";
import { parseDateKey, addDays, dateKey } from "./dates";
import type { FlowEvent } from "@/types/event";
import type { Routine, RoutineStatus } from "@/types/routine";
import type { Task } from "@/types/todo";

export interface DueReminder {
  /** Clave única (incluye la fecha) para no repetir el aviso. */
  key: string;
  name: string;
  body: string;
  url: string;
}

export interface ReminderParams {
  events: FlowEvent[];
  routines: Routine[];
  tasks: Task[];
  getStatus: (routineId: string, dateKey: string) => RoutineStatus;
  labels: { routineNow: string; taskDue: string };
  /** Tolerancia (ms) para recordatorios con hora exacta. */
  windowMs?: number;
  /** Hora del día (0-23) en que avisar tareas que vencen hoy. */
  taskRemindHour?: number;
}

/**
 * Calcula qué recordatorios corresponden disparar en el instante `now`.
 * Función pura (sin estado ni efectos) → fácil de testear.
 */
export function computeDueReminders(
  now: number,
  p: ReminderParams,
): DueReminder[] {
  const windowMs = p.windowMs ?? 90_000;
  const taskHour = p.taskRemindHour ?? 9;
  const today = new Date(now);
  const tk = dateKey(today);
  const out: DueReminder[] = [];

  // ── Eventos: X minutos antes de la hora de inicio ──
  const occ = occurrencesInRange(p.events, new Date(now), addDays(today, 2));
  for (const { event, date } of occ) {
    if (event.reminderMinutes == null || !event.startTime) continue;
    const [h, m] = event.startTime.split(":").map(Number);
    const start = parseDateKey(date);
    start.setHours(h ?? 0, m ?? 0, 0, 0);
    const remindAt = start.getTime() - event.reminderMinutes * 60_000;
    if (now >= remindAt && now < remindAt + windowMs) {
      const body =
        event.startTime + (event.location ? ` · ${event.location}` : "");
      out.push({
        key: `event_${event.id}_${date}`,
        name: event.title,
        body,
        url: "/events",
      });
    }
  }

  // ── Rutinas: a la hora de inicio; activas, no pausadas, sin marcar ──
  for (const r of p.routines) {
    if (!routineRunsOn(r, today)) continue;
    if (isRoutinePausedOn(r, tk)) continue;
    if (p.getStatus(r.id, tk) !== "pending") continue;
    const [h, m] = r.startTime.split(":").map(Number);
    const start = new Date(now);
    start.setHours(h ?? 0, m ?? 0, 0, 0);
    const remindAt = start.getTime();
    if (now >= remindAt && now < remindAt + windowMs) {
      out.push({
        key: `routine_${r.id}_${tk}`,
        name: r.name,
        body: p.labels.routineNow,
        url: "/routines",
      });
    }
  }

  // ── Tareas que vencen hoy (catch-up: avisa al abrir la app) ──
  for (const task of p.tasks) {
    if (task.status === "completed" || task.dueDate !== tk) continue;
    const remindAt = parseDateKey(tk);
    remindAt.setHours(taskHour, 0, 0, 0);
    if (now >= remindAt.getTime()) {
      out.push({
        key: `task_${task.id}_${tk}`,
        name: task.title,
        body: p.labels.taskDue,
        url: "/todo",
      });
    }
  }

  return out;
}
