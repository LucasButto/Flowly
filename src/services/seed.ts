import { createRoutine } from "./routines";
import { createList, createTask } from "./todos";
import { createEvent } from "./events";
import { dateKey, addDays } from "@/utils/dates";
import { newId } from "@/utils/ids";
import type { RoutineInput } from "@/types/routine";
import type { Weekday } from "@/types/common";
import type { EventRecurrence } from "@/types/event";

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WD: Weekday[] = [1, 2, 3, 4, 5];

// ─── Rutinas ───
const ROUTINES: RoutineInput[] = [
  { name: "Meditar", startTime: "07:00", endTime: "07:15", days: [...ALL], frequency: "daily", tag: "Bienestar", description: "5 minutos de respiración consciente.", color: "#8b5cf6" },
  { name: "Planificar el día", startTime: "08:30", endTime: "08:45", days: [...WD], frequency: "weekdays", tag: "Productividad", description: "Revisar tareas y agenda del día.", color: "#f59e0b" },
  { name: "Ejercicio", startTime: "18:00", endTime: "19:00", days: [...WD], frequency: "weekdays", tag: "Salud", description: "Rutina de fuerza o cardio.", color: "#22c55e" },
  { name: "Repaso de inglés", startTime: "20:00", endTime: "20:30", days: [1, 3, 5], frequency: "custom", tag: "Estudio", description: "Vocabulario + listening.", color: "#38bdf8" },
  { name: "Leer", startTime: "22:00", endTime: "22:30", days: [...ALL], frequency: "daily", tag: "Hábitos", description: "Al menos 10 páginas.", color: "#6366f1" },
];

// ─── Listas + tareas ───
interface SeedTask {
  title: string;
  description?: string;
  dueOffset?: number | null;
  tags?: string[];
  subtasks?: string[];
  favorite?: boolean;
}
interface SeedList {
  name: string;
  color: string;
  tasks: SeedTask[];
}

const LISTS: SeedList[] = [
  {
    name: "Supermercado",
    color: "#22c55e",
    tasks: [
      { title: "Leche" },
      { title: "Pan integral" },
      { title: "Huevos" },
      { title: "Frutas y verduras" },
      { title: "Café", favorite: true },
    ],
  },
  {
    name: "Trabajo",
    color: "#6366f1",
    tasks: [
      { title: "Responder correos pendientes", dueOffset: 0, tags: ["urgente"] },
      { title: "Preparar presentación", dueOffset: 2, tags: ["proyecto"], subtasks: ["Armar slides", "Revisar datos", "Ensayar"], favorite: true },
      { title: "Llamar al proveedor", dueOffset: 1 },
      { title: "Revisar pull requests" },
    ],
  },
  {
    name: "Hogar",
    color: "#f59e0b",
    tasks: [
      { title: "Pagar servicios", dueOffset: 5 },
      { title: "Ordenar el placard" },
      { title: "Cambiar lámpara del living" },
    ],
  },
  {
    name: "Universidad",
    color: "#38bdf8",
    tasks: [
      { title: "Entregar TP de Algoritmos", dueOffset: 3, tags: ["entrega"], subtasks: ["Resolver ejercicios", "Documentar", "Subir al campus"] },
      { title: "Estudiar para el parcial", dueOffset: 7 },
      { title: "Leer capítulo 4" },
    ],
  },
];

// ─── Eventos ───
interface SeedEvent {
  title: string;
  dayOffset: number;
  startTime: string | null;
  endTime: string | null;
  location?: string;
  description?: string;
  tags?: string[];
  color: string;
  recurrence?: EventRecurrence;
  reminderMinutes?: number | null;
}

const EVENTS: SeedEvent[] = [
  { title: "Reunión de equipo", dayOffset: 0, startTime: "10:00", endTime: "11:00", location: "Zoom", description: "Daily standup", tags: ["trabajo"], color: "#6366f1", recurrence: "weekly", reminderMinutes: 10 },
  { title: "Almuerzo con Ana", dayOffset: 0, startTime: "13:00", endTime: "14:00", location: "Centro", color: "#ec4899", reminderMinutes: 30 },
  { title: "Gimnasio", dayOffset: 0, startTime: "18:30", endTime: "19:30", tags: ["salud"], color: "#22c55e", recurrence: "weekly", reminderMinutes: 30 },
  { title: "Pago de alquiler", dayOffset: 1, startTime: null, endTime: null, color: "#ef4444", recurrence: "monthly" },
  { title: "Cumpleaños de Leo", dayOffset: 2, startTime: null, endTime: null, description: "Comprar regalo 🎁", color: "#f59e0b" },
  { title: "Dentista", dayOffset: 4, startTime: "16:00", endTime: "16:45", location: "Clínica Norte", color: "#38bdf8", reminderMinutes: 60 },
];

/** Crea rutinas, listas+tareas y eventos de ejemplo en la cuenta del usuario. */
export async function seedSampleData(uid: string) {
  for (const r of ROUTINES) {
    await createRoutine(uid, r);
  }

  let listOrder = 0;
  for (const l of LISTS) {
    const ref = await createList(uid, { name: l.name, color: l.color }, listOrder++);
    let taskOrder = 0;
    for (const t of l.tasks) {
      await createTask(
        uid,
        {
          listId: ref.id,
          title: t.title,
          description: t.description ?? "",
          dueDate:
            t.dueOffset == null ? null : dateKey(addDays(new Date(), t.dueOffset)),
          tags: t.tags ?? [],
          subtasks: (t.subtasks ?? []).map((s) => ({
            id: newId(),
            title: s,
            done: false,
          })),
          favorite: t.favorite ?? false,
        },
        taskOrder++,
      );
    }
  }

  for (const e of EVENTS) {
    await createEvent(uid, {
      title: e.title,
      date: dateKey(addDays(new Date(), e.dayOffset)),
      startTime: e.startTime,
      endTime: e.endTime,
      description: e.description ?? "",
      location: e.location ?? "",
      tags: e.tags ?? [],
      color: e.color,
      recurrence: e.recurrence ?? "none",
      recurrenceEnd: null,
      reminderMinutes: e.reminderMinutes ?? null,
    });
  }
}
