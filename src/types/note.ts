import type { NoteBlock } from "./blocks";

export type { NoteBlock, NoteBlockType } from "./blocks";

export interface Note {
  id: string;
  title: string;
  /** Color de acento de la card (mismos presets que rutinas/listas). */
  color: string;
  pinned: boolean;
  blocks: NoteBlock[];
  createdAt: number;
  updatedAt: number;
}

export type NoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
