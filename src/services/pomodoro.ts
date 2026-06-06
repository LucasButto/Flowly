import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { PomodoroSession } from "@/types/pomodoro";

const sessionsCol = (uid: string) =>
  collection(db, "users", uid, "pomodoroSessions");

export function subscribePomodoroSessions(
  uid: string,
  onData: (sessions: PomodoroSession[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(sessionsCol(uid), orderBy("completedAt", "desc"));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PomodoroSession),
      ),
    onError,
  );
}

export async function createPomodoroSession(
  uid: string,
  session: Omit<PomodoroSession, "id">,
) {
  return addDoc(sessionsCol(uid), session);
}
