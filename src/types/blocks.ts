/** Tipos de bloque de contenido enriquecido (notas, descripciones de tareas). */
export type NoteBlockType =
  | "text" // párrafo
  | "h1" // título grande
  | "h2" // subtítulo
  | "bullet" // lista con viñetas
  | "number" // lista numerada
  | "check" // checklist
  | "quote" // cita
  | "divider"; // separador horizontal

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  text: string;
  /** Solo para bloques "check". */
  checked?: boolean;
}
