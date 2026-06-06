/** Paleta de colores preestablecidos para rutinas, listas y eventos. */
export const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#38bdf8", // sky
  "#3b82f6", // blue
  "#64748b", // slate
] as const;

export const DEFAULT_COLOR = PRESET_COLORS[0];

/** Devuelve negro o blanco según el contraste sobre `hex`. */
export function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#fff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}
