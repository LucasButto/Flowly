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
  subscribeNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/services/notes";
import type { Note, NoteInput } from "@/types/note";

interface NotesContextType {
  notes: Note[];
  loaded: boolean;
  addNote: (input: NoteInput) => Promise<string | undefined>;
  editNote: (id: string, patch: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  togglePin: (note: Note) => Promise<void>;
  duplicateNote: (note: Note) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setNotes([]);
      setLoaded(false);
      return;
    }
    setLoaded(false);
    const unsub = subscribeNotes(
      user.uid,
      (data) => {
        setNotes(data);
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        toast("No se pudieron cargar las notas", "error");
        setLoaded(true);
      },
    );
    return unsub;
  }, [isLoggedIn, user?.uid, toast]);

  const addNote = useCallback(
    async (input: NoteInput): Promise<string | undefined> => {
      if (!user?.uid) return undefined;
      try {
        const ref = await createNote(user.uid, input);
        return ref.id;
      } catch (err) {
        console.error(err);
        toast("No se pudo crear la nota", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const editNote = useCallback(
    async (id: string, patch: Partial<Note>) => {
      if (!user?.uid) return;
      try {
        await updateNote(user.uid, id, patch);
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la nota", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const removeNote = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteNote(user.uid, id);
      } catch (err) {
        console.error(err);
        toast("No se pudo eliminar la nota", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const togglePin = useCallback(
    async (note: Note) => {
      if (!user?.uid) return;
      try {
        await updateNote(user.uid, note.id, { pinned: !note.pinned });
      } catch (err) {
        console.error(err);
      }
    },
    [user?.uid],
  );

  const duplicateNote = useCallback(
    async (note: Note) => {
      if (!user?.uid) return;
      try {
        await createNote(user.uid, {
          title: note.title,
          color: note.color,
          pinned: false,
          blocks: note.blocks.map((b) => ({ ...b })),
        });
      } catch (err) {
        console.error(err);
        toast("No se pudo duplicar la nota", "error");
      }
    },
    [user?.uid, toast],
  );

  return (
    <NotesContext.Provider
      value={{
        notes,
        loaded,
        addNote,
        editNote,
        removeNote,
        togglePin,
        duplicateNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes debe usarse dentro de NotesProvider");
  return ctx;
}
