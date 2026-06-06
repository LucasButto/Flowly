import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { dateKey, parseDateKey, addDays } from "@/utils/dates";
import type { EventInput, FlowEvent } from "@/types/event";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/**
 * Pide (o re-pide) permiso de Google Calendar y devuelve un access token fresco.
 * Firebase no persiste este token, así que se obtiene on-demand al sincronizar.
 */
export async function getCalendarToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope(SCOPE);
  const current = auth.currentUser;
  const result = current
    ? await reauthenticateWithPopup(current, provider)
    : await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error("No se obtuvo el token de Google Calendar");
  return token;
}

// ─── Tipos mínimos de la API de Google Calendar ───
interface GoogleDate {
  date?: string; // all-day "YYYY-MM-DD"
  dateTime?: string; // RFC3339
}
interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleDate;
  end?: GoogleDate;
  reminders?: { overrides?: { minutes: number }[] };
  status?: string;
}
interface GoogleEventBody {
  summary: string;
  description?: string;
  location?: string;
  start: GoogleDate & { timeZone?: string };
  end: GoogleDate & { timeZone?: string };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** Mapea un evento de Google a un EventInput de Flowly (+ su googleEventId). */
export function googleToFlow(
  g: GoogleEvent,
): (EventInput & { googleEventId: string }) | null {
  if (!g.start) return null;
  let date: string;
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (g.start.date) {
    date = g.start.date;
  } else if (g.start.dateTime) {
    date = dateKey(new Date(g.start.dateTime));
    startTime = hhmm(g.start.dateTime);
    endTime = g.end?.dateTime ? hhmm(g.end.dateTime) : null;
  } else {
    return null;
  }

  return {
    title: g.summary || "(sin título)",
    date,
    startTime,
    endTime,
    description: g.description || "",
    location: g.location || "",
    tags: [],
    color: "#6366f1",
    recurrence: "none",
    recurrenceEnd: null,
    reminderMinutes: g.reminders?.overrides?.[0]?.minutes ?? null,
    googleEventId: g.id,
  };
}

/** Convierte un evento de Flowly al body de la API de Google. */
export function flowToGoogle(event: FlowEvent, timeZone: string): GoogleEventBody {
  const body: GoogleEventBody = {
    summary: event.title,
    start: {},
    end: {},
  };
  if (event.description) body.description = event.description;
  if (event.location) body.location = event.location;

  if (!event.startTime) {
    body.start = { date: event.date };
    body.end = { date: dateKey(addDays(parseDateKey(event.date), 1)) };
  } else {
    body.start = { dateTime: `${event.date}T${event.startTime}:00`, timeZone };
    const endT = event.endTime || event.startTime;
    body.end = { dateTime: `${event.date}T${endT}:00`, timeZone };
  }

  if (event.recurrence !== "none") {
    let rule: string;
    if (event.recurrence === "businessDay") {
      const off = event.businessDayOffset ?? 1;
      rule = `RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=${off}`;
    } else {
      const freq =
        event.recurrence === "daily"
          ? "DAILY"
          : event.recurrence === "weekly"
            ? "WEEKLY"
            : event.recurrence === "yearly"
              ? "YEARLY"
              : "MONTHLY";
      rule = `RRULE:FREQ=${freq}`;
    }
    if (event.recurrenceEnd)
      rule += `;UNTIL=${event.recurrenceEnd.replace(/-/g, "")}T235959Z`;
    body.recurrence = [rule];
  }

  if (event.reminderMinutes != null) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: "popup", minutes: event.reminderMinutes }],
    };
  }

  return body;
}

export async function fetchGoogleEvents(
  token: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`${API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Calendar API ${res.status}`);
  const data = (await res.json()) as { items?: GoogleEvent[] };
  return (data.items ?? []).filter((e) => e.status !== "cancelled");
}

export async function pushGoogleEvent(
  token: string,
  body: GoogleEventBody,
): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google Calendar API ${res.status}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}
