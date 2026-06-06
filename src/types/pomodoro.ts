export type PomodoroPhase = "work" | "break";

export type PomodoroLinkType = "none" | "task" | "routine";

export interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  cycles: number;
}

/** Pomodoro personalizado con nombre, guardado por el usuario. */
export interface PomodoroPreset extends PomodoroConfig {
  id: string;
  name: string;
}

export interface PomodoroLink {
  type: PomodoroLinkType;
  id: string | null;
  label: string | null;
}

/** Registro de un bloque de enfoque completado. */
export interface PomodoroSession {
  id: string;
  date: string; // "YYYY-MM-DD"
  focusMinutes: number;
  completedAt: number;
  linkType: PomodoroLinkType;
  linkId: string | null;
  linkLabel: string | null;
}
