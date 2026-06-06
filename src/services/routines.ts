import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  Routine,
  RoutineInput,
  RoutineLog,
  RoutineStatus,
} from "@/types/routine";

const routinesCol = (uid: string) => collection(db, "users", uid, "routines");
const logsCol = (uid: string) => collection(db, "users", uid, "routineLogs");

export function subscribeRoutines(
  uid: string,
  onData: (routines: Routine[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(routinesCol(uid), orderBy("startTime", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Routine));
    },
    onError,
  );
}

export function subscribeRoutineLogs(
  uid: string,
  onData: (logs: RoutineLog[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    logsCol(uid),
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoutineLog));
    },
    onError,
  );
}

export async function createRoutine(uid: string, input: RoutineInput) {
  const now = Date.now();
  return addDoc(routinesCol(uid), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateRoutine(
  uid: string,
  id: string,
  patch: Partial<RoutineInput>,
) {
  return updateDoc(doc(routinesCol(uid), id), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deleteRoutine(uid: string, id: string) {
  // Borrar la rutina y sus logs asociados
  const batch = writeBatch(db);
  batch.delete(doc(routinesCol(uid), id));
  const logsSnap = await getDocs(
    query(logsCol(uid), where("routineId", "==", id)),
  );
  logsSnap.forEach((d) => batch.delete(d.ref));
  return batch.commit();
}

export async function setRoutineLog(
  uid: string,
  routineId: string,
  date: string,
  status: RoutineStatus,
) {
  const id = `${routineId}_${date}`;
  return setDoc(doc(logsCol(uid), id), {
    routineId,
    date,
    status,
    updatedAt: Date.now(),
  });
}

export async function clearRoutineLog(
  uid: string,
  routineId: string,
  date: string,
) {
  return deleteDoc(doc(logsCol(uid), `${routineId}_${date}`));
}
