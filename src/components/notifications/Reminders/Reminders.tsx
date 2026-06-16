"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useEvents } from "@/contexts/EventsContext";
import { useRoutines } from "@/contexts/RoutinesContext";
import { useTodo } from "@/contexts/TodoContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import { todayKey } from "@/utils/dates";
import { computeDueReminders } from "@/utils/reminders";
import {
  notify,
  playChime,
  unlockAudio,
  registerNotificationSW,
} from "@/utils/notify";

const STORE_KEY = "flowly_fired_reminders";
const CHECK_MS = 30_000;

/** Carga las claves ya disparadas, descartando las de días anteriores. */
function loadFired(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
    const today = todayKey();
    return new Set(
      arr.filter((k) => {
        const m = k.match(/_(\d{4}-\d{2}-\d{2})$/);
        return m ? m[1]! >= today : true;
      }),
    );
  } catch {
    return new Set();
  }
}

function saveFired(set: Set<string>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

/**
 * Componente invisible: mientras la app está abierta revisa eventos, rutinas y
 * tareas con recordatorio y dispara notificación + sonido + aviso in-app.
 */
export default function Reminders() {
  const t = useTranslations("reminders");
  const { events } = useEvents();
  const { routines, getStatus } = useRoutines();
  const { tasks } = useTodo();
  const { settings } = useSettings();
  const toast = useToast();

  const firedRef = useRef<Set<string> | null>(null);
  if (firedRef.current === null) firedRef.current = loadFired();

  // Registrar el SW y desbloquear el audio al primer click del usuario.
  useEffect(() => {
    if (!settings.notifications) return;
    void registerNotificationSW();
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, [settings.notifications]);

  useEffect(() => {
    if (!settings.notifications) return;
    const fired = firedRef.current!;

    const check = () => {
      const due = computeDueReminders(Date.now(), {
        events,
        routines,
        tasks,
        getStatus,
        labels: { routineNow: t("routineNow"), taskDue: t("taskDue") },
      });
      for (const r of due) {
        if (fired.has(r.key)) continue;
        fired.add(r.key);
        saveFired(fired);
        void notify(`Flowly · ${r.name}`, {
          body: r.body,
          tag: r.key,
          url: r.url,
        });
        playChime(settings.soundDuration);
        toast(`${r.name} · ${r.body}`, "info");
      }
    };

    check();
    const id = setInterval(check, CHECK_MS);
    return () => clearInterval(id);
  }, [
    events,
    routines,
    tasks,
    getStatus,
    settings.notifications,
    settings.soundDuration,
    toast,
    t,
  ]);

  return null;
}
