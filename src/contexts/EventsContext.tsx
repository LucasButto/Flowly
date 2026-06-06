"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import {
  subscribeEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/services/events";
import {
  getCalendarToken,
  fetchGoogleEvents,
  googleToFlow,
  flowToGoogle,
  pushGoogleEvent,
} from "@/services/googleCalendar";
import { addDays } from "@/utils/dates";
import type { FlowEvent, EventInput } from "@/types/event";

interface EventsContextType {
  events: FlowEvent[];
  loaded: boolean;
  addEvent: (input: EventInput) => Promise<void>;
  editEvent: (id: string, patch: Partial<EventInput>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  importFromGoogle: () => Promise<number>;
  exportToGoogle: () => Promise<number>;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState<FlowEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setEvents([]);
      setLoaded(false);
      return;
    }
    setLoaded(false);
    const unsub = subscribeEvents(
      user.uid,
      (data) => {
        setEvents(data);
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        toast("No se pudieron cargar los eventos", "error");
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [isLoggedIn, user?.uid, toast]);

  const addEvent = useCallback(
    async (input: EventInput) => {
      if (!user?.uid) return;
      try {
        await createEvent(user.uid, input);
      } catch (err) {
        console.error(err);
        toast("No se pudo crear el evento", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const editEvent = useCallback(
    async (id: string, patch: Partial<EventInput>) => {
      if (!user?.uid) return;
      try {
        await updateEvent(user.uid, id, patch);
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar el evento", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteEvent(user.uid, id);
      } catch (err) {
        console.error(err);
        toast("No se pudo eliminar el evento", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  // Trae eventos de Google Calendar (ventana ±) y crea los que falten
  const importFromGoogle = useCallback(async (): Promise<number> => {
    if (!user?.uid) return 0;
    const uid = user.uid;
    const token = await getCalendarToken();
    const gEvents = await fetchGoogleEvents(
      token,
      addDays(new Date(), -31),
      addDays(new Date(), 90),
    );
    const existing = new Set(
      events.map((e) => e.googleEventId).filter(Boolean) as string[],
    );
    let count = 0;
    for (const g of gEvents) {
      if (existing.has(g.id)) continue;
      const mapped = googleToFlow(g);
      if (!mapped) continue;
      await createEvent(uid, mapped);
      count++;
    }
    return count;
  }, [user?.uid, events]);

  // Sube a Google los eventos de Flowly que aún no están vinculados
  const exportToGoogle = useCallback(async (): Promise<number> => {
    if (!user?.uid) return 0;
    const uid = user.uid;
    const token = await getCalendarToken();
    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Argentina/Buenos_Aires";
    let count = 0;
    for (const e of events) {
      if (e.googleEventId) continue;
      const gid = await pushGoogleEvent(token, flowToGoogle(e, tz));
      await updateEvent(uid, e.id, { googleEventId: gid });
      count++;
    }
    return count;
  }, [user?.uid, events]);

  return (
    <EventsContext.Provider
      value={{
        events,
        loaded,
        addEvent,
        editEvent,
        removeEvent,
        importFromGoogle,
        exportToGoogle,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents debe usarse dentro de EventsProvider");
  return ctx;
}
