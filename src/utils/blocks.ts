import { newId } from "@/utils/ids";
import type { NoteBlock, NoteBlockType } from "@/types/blocks";

export const newBlock = (type: NoteBlockType = "text"): NoteBlock => ({
  id: newId(),
  type,
  text: "",
  ...(type === "check" ? { checked: false } : {}),
});

/** Descarta bloques de texto vacíos (los separadores se conservan). */
export function cleanBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return blocks.filter((b) => b.type === "divider" || b.text.trim() !== "");
}

/** Texto plano de los bloques (para búsqueda / compatibilidad). */
export function blocksToPlainText(blocks: NoteBlock[]): string {
  return blocks
    .filter((b) => b.type !== "divider")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Convierte texto plano legado en bloques (una línea = un párrafo). */
export function textToBlocks(text: string): NoteBlock[] {
  if (!text.trim()) return [];
  return text.split("\n").map((line) => ({
    id: newId(),
    type: "text" as const,
    text: line,
  }));
}
