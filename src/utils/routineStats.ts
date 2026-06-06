import type { Routine, RoutineStatus, RoutineStats } from "@/types/routine";
import { dateKey, addDays, getWeekday } from "./dates";

export type StatusLookup = (routineId: string, key: string) => RoutineStatus;

/** ¿La rutina corre en la fecha dada (según sus días de la semana)? */
export function routineRunsOn(routine: Routine, date: Date): boolean {
  return routine.days.includes(getWeekday(date));
}

function startDate(routine: Routine): Date {
  const d = new Date(routine.createdAt);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Estadísticas de una rutina (racha, mejor racha, cumplimiento). */
export function computeRoutineStats(
  routine: Routine,
  getStatus: StatusLookup,
  today: Date = new Date(),
): RoutineStats {
  let completed = 0;
  let skipped = 0;
  let scheduled = 0;
  let bestStreak = 0;
  let run = 0;

  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  const todayK = dateKey(end);

  const occ: { key: string; status: RoutineStatus }[] = [];

  for (let d = startDate(routine); d <= end; d = addDays(d, 1)) {
    if (!routineRunsOn(routine, d)) continue;
    const key = dateKey(d);
    const status = getStatus(routine.id, key);
    occ.push({ key, status });

    // No contar "hoy pendiente" en el denominador de cumplimiento
    const countable = !(key === todayK && status === "pending");
    if (countable) scheduled++;

    if (status === "completed") {
      completed++;
      run++;
      if (run > bestStreak) bestStreak = run;
    } else if (status === "skipped") {
      skipped++;
      run = 0;
    } else {
      run = 0;
    }
  }

  // Racha actual: hacia atrás desde el final
  let currentStreak = 0;
  for (let i = occ.length - 1; i >= 0; i--) {
    const item = occ[i]!;
    if (item.status === "completed") {
      currentStreak++;
    } else if (item.status === "pending" && item.key === todayK) {
      continue; // hoy todavía no se marcó → no rompe la racha
    } else {
      break;
    }
  }

  const completionRate =
    scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

  return { completed, skipped, currentStreak, bestStreak, completionRate };
}

export interface DayAggregate {
  completed: number;
  skipped: number;
  pending: number;
  scheduled: number;
  rate: number; // 0–100
}

/** Agregado de todas las rutinas para un día concreto. */
export function dayAggregate(
  routines: Routine[],
  getStatus: StatusLookup,
  date: Date,
): DayAggregate {
  let completed = 0;
  let skipped = 0;
  let pending = 0;
  let scheduled = 0;
  const key = dateKey(date);
  const created = (r: Routine) => {
    const c = new Date(r.createdAt);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  for (const r of routines) {
    if (!routineRunsOn(r, date)) continue;
    if (created(r) > target) continue; // no existía aún ese día
    scheduled++;
    const s = getStatus(r.id, key);
    if (s === "completed") completed++;
    else if (s === "skipped") skipped++;
    else pending++;
  }

  const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
  return { completed, skipped, pending, scheduled, rate };
}

/** Tasa de cumplimiento promedio en un rango de días [from, to]. */
export function rangeCompletion(
  routines: Routine[],
  getStatus: StatusLookup,
  from: Date,
  to: Date,
): number {
  let completed = 0;
  let scheduled = 0;
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
    const agg = dayAggregate(routines, getStatus, d);
    completed += agg.completed;
    scheduled += agg.scheduled;
  }
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}
