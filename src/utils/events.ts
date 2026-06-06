import type { FlowEvent, EventOccurrence } from "@/types/event";
import { dateKey, parseDateKey, getWeekday, addDays, timeToMinutes } from "./dates";

function isBusinessDay(d: Date): boolean {
  const wd = d.getDay();
  return wd !== 0 && wd !== 6; // L-V (sin feriados)
}

/**
 * Devuelve el N-ésimo día hábil del mes. `offset` positivo cuenta desde el
 * inicio (1 = primero); negativo desde el final (-1 = último).
 */
export function nthBusinessDayOfMonth(
  year: number,
  month: number,
  offset: number,
): Date | null {
  if (!offset) return null;
  const last = new Date(year, month + 1, 0).getDate();
  let count = 0;
  if (offset > 0) {
    for (let day = 1; day <= last; day++) {
      const d = new Date(year, month, day);
      if (isBusinessDay(d) && ++count === offset) return d;
    }
  } else {
    for (let day = last; day >= 1; day--) {
      const d = new Date(year, month, day);
      if (isBusinessDay(d) && ++count === -offset) return d;
    }
  }
  return null;
}

/** ¿El evento (con su recurrencia) ocurre en la fecha dada? */
export function eventOccursOn(ev: FlowEvent, date: Date): boolean {
  const target = dateKey(date);
  if (target < ev.date) return false;
  if (ev.recurrenceEnd && target > ev.recurrenceEnd) return false;
  if (ev.excludedDates && ev.excludedDates.includes(target)) return false;

  switch (ev.recurrence) {
    case "none":
      return target === ev.date;
    case "daily":
      return true;
    case "weekly":
      return getWeekday(date) === getWeekday(parseDateKey(ev.date));
    case "monthly":
      return date.getDate() === parseDateKey(ev.date).getDate();
    case "yearly": {
      const anchor = parseDateKey(ev.date);
      return (
        date.getMonth() === anchor.getMonth() &&
        date.getDate() === anchor.getDate()
      );
    }
    case "businessDay": {
      const bd = nthBusinessDayOfMonth(
        date.getFullYear(),
        date.getMonth(),
        ev.businessDayOffset ?? 1,
      );
      return bd ? dateKey(bd) === target : false;
    }
    default:
      return false;
  }
}

/** Eventos que ocurren en una fecha concreta. */
export function eventsOnDate(events: FlowEvent[], date: Date): FlowEvent[] {
  return events.filter((ev) => eventOccursOn(ev, date));
}

/** Ocurrencias dentro de un rango [from, to] (inclusive). */
export function occurrencesInRange(
  events: FlowEvent[],
  from: Date,
  to: Date,
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
    for (const ev of events) {
      if (eventOccursOn(ev, d)) out.push({ event: ev, date: dateKey(d) });
    }
  }
  return out;
}

/** Eventos con horario que se solapan con el borrador en su fecha. */
export function eventConflicts(
  events: FlowEvent[],
  draft: { date: string; startTime: string | null; endTime: string | null },
  excludeId?: string,
): FlowEvent[] {
  if (!draft.startTime) return [];
  const ds = timeToMinutes(draft.startTime);
  const de = draft.endTime ? timeToMinutes(draft.endTime) : ds + 60;
  const day = parseDateKey(draft.date);

  return events.filter((ev) => {
    if (ev.id === excludeId) return false;
    if (!ev.startTime) return false;
    if (!eventOccursOn(ev, day)) return false;
    const es = timeToMinutes(ev.startTime);
    const ee = ev.endTime ? timeToMinutes(ev.endTime) : es + 60;
    return ds < ee && es < de;
  });
}

export interface PositionedEvent {
  event: FlowEvent;
  startMin: number;
  endMin: number;
  col: number;
  cols: number;
}

/** Reparte eventos con horario en columnas para no solaparse visualmente. */
export function layoutTimedEvents(events: FlowEvent[]): PositionedEvent[] {
  const items: PositionedEvent[] = events
    .filter((e) => e.startTime)
    .map((e) => {
      const startMin = timeToMinutes(e.startTime as string);
      const endMin = e.endTime
        ? Math.max(timeToMinutes(e.endTime), startMin + 15)
        : startMin + 60;
      return { event: e, startMin, endMin, col: 0, cols: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const colEnds: number[] = [];
    for (const ev of cluster) {
      let placed = false;
      for (let i = 0; i < colEnds.length; i++) {
        if (ev.startMin >= colEnds[i]!) {
          ev.col = i;
          colEnds[i] = ev.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev.col = colEnds.length;
        colEnds.push(ev.endMin);
      }
    }
    const total = colEnds.length;
    for (const ev of cluster) ev.cols = total;
    result.push(...cluster);
    cluster = [];
  };

  for (const ev of items) {
    if (cluster.length && ev.startMin >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.endMin);
  }
  if (cluster.length) flush();

  return result;
}
