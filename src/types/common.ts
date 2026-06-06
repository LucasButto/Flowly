/** Día de la semana en convención JS: 0 = Domingo … 6 = Sábado. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Orden de visualización Lunes → Domingo (los valores siguen siendo JS getDay). */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAYS_MON_FRI: Weekday[] = [1, 2, 3, 4, 5];
export const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const DAY_KEYS: Record<Weekday, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};
