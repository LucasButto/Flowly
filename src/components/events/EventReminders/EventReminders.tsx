"use client";
import { useEffect, useRef } from "react";
import { useEvents } from "@/contexts/EventsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { occurrencesInRange } from "@/utils/events";
import { parseDateKey, addDays } from "@/utils/dates";
import { notify } from "@/utils/notify";

/**
 * Componente invisible: mientras la app está abierta, revisa los eventos con
 * recordatorio y dispara una notificación cuando corresponde.
 */
export default function EventReminders() {
  const { events } = useEvents();
  const { settings } = useSettings();
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.notifications) return;
    const fired = firedRef.current;

    const check = () => {
      const now = Date.now();
      const occ = occurrencesInRange(events, new Date(), addDays(new Date(), 2));
      for (const { event, date } of occ) {
        if (event.reminderMinutes == null || !event.startTime) continue;
        const [h, m] = event.startTime.split(":").map(Number);
        const start = parseDateKey(date);
        start.setHours(h ?? 0, m ?? 0, 0, 0);
        const remindAt = start.getTime() - event.reminderMinutes * 60000;
        const key = `${event.id}_${date}`;
        if (now >= remindAt && now < remindAt + 60000 && !fired.has(key)) {
          fired.add(key);
          notify(
            `Flowly · ${event.title}`,
            `${event.startTime}${event.location ? " · " + event.location : ""}`,
            key,
          );
        }
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [events, settings.notifications]);

  return null;
}
