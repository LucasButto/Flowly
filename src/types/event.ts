export type EventRecurrence =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "businessDay";

export interface FlowEvent {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" (fecha ancla)
  startTime: string | null; // "HH:mm" — null = todo el día
  endTime: string | null; // "HH:mm"
  description: string;
  location: string;
  tags: string[];
  color: string;
  recurrence: EventRecurrence;
  recurrenceEnd: string | null; // "YYYY-MM-DD" límite de repetición
  // Para recurrence "businessDay": ordinal del día hábil del mes.
  // Positivo = desde el inicio (1 = primero), negativo = desde el final (-1 = último).
  businessDayOffset?: number | null;
  // Fechas "YYYY-MM-DD" excluidas de la recurrencia (al editar/eliminar "solo este").
  excludedDates?: string[];
  reminderMinutes: number | null; // minutos antes para avisar
  googleEventId?: string | null; // id del evento en Google Calendar (sync)
  createdAt: number;
  updatedAt: number;
}

export type EventInput = Omit<FlowEvent, "id" | "createdAt" | "updatedAt">;

/** Una ocurrencia concreta de un evento en una fecha (para vistas y recurrencia). */
export interface EventOccurrence {
  event: FlowEvent;
  date: string; // "YYYY-MM-DD" de esta ocurrencia
}
