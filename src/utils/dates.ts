import type { Weekday } from "@/types/common";

/** Clave de fecha local "YYYY-MM-DD" (sin desfase de zona horaria). */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** Parsea "YYYY-MM-DD" como fecha local (mediodía para evitar saltos de DST). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function getWeekday(date: Date = new Date()): Weekday {
  return date.getDay() as Weekday;
}

/** Lunes de la semana que contiene `date`. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Dom
  const diff = day === 0 ? -6 : 1 - day; // retroceder al lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Los 7 días (Lun→Dom) de la semana que contiene `date`. */
export function weekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Horas ───
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** ¿Se solapan dos rangos horarios [aStart,aEnd) y [bStart,bEnd)? */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  const be = timeToMinutes(bEnd);
  return as < be && bs < ae;
}

// ─── Formateo (Intl) ───
export function formatDate(
  date: Date,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
  locale = "es-AR",
): string {
  return new Intl.DateTimeFormat(locale, opts).format(date);
}

export function formatTime(time: string): string {
  return time; // "HH:mm" 24h — ya legible
}

export function formatRelativeDay(
  key: string,
  t: { today: string; yesterday: string; tomorrow: string },
  locale = "es-AR",
): string {
  if (key === todayKey()) return t.today;
  if (key === dateKey(addDays(new Date(), -1))) return t.yesterday;
  if (key === dateKey(addDays(new Date(), 1))) return t.tomorrow;
  return formatDate(parseDateKey(key), { day: "numeric", month: "short" }, locale);
}

export function getGreetingKey(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}
