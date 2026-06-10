import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Note, NoteInput } from "@/types/note";

const notesCol = (uid: string) => collection(db, "users", uid, "notes");

export function subscribeNotes(
  uid: string,
  onData: (notes: Note[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(notesCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Note)),
    onError,
  );
}

export async function createNote(uid: string, input: NoteInput) {
  const now = Date.now();
  return addDoc(notesCol(uid), {
    title: input.title,
    color: input.color,
    pinned: input.pinned ?? false,
    blocks: input.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateNote(
  uid: string,
  id: string,
  patch: Partial<Note>,
) {
  return updateDoc(doc(notesCol(uid), id), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(uid: string, id: string) {
  return deleteDoc(doc(notesCol(uid), id));
}
