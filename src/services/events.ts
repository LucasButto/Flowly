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
import type { FlowEvent, EventInput } from "@/types/event";

const eventsCol = (uid: string) => collection(db, "users", uid, "events");

export function subscribeEvents(
  uid: string,
  onData: (events: FlowEvent[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(eventsCol(uid), orderBy("date", "asc"));
  return onSnapshot(
    q,
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FlowEvent)),
    onError,
  );
}

export async function createEvent(uid: string, input: EventInput) {
  const now = Date.now();
  return addDoc(eventsCol(uid), { ...input, createdAt: now, updatedAt: now });
}

export async function updateEvent(
  uid: string,
  id: string,
  patch: Partial<EventInput>,
) {
  return updateDoc(doc(eventsCol(uid), id), { ...patch, updatedAt: Date.now() });
}

export async function deleteEvent(uid: string, id: string) {
  return deleteDoc(doc(eventsCol(uid), id));
}
