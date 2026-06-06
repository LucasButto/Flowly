import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { TodoList, TodoListInput, Task, TaskInput } from "@/types/todo";

const listsCol = (uid: string) => collection(db, "users", uid, "lists");
const tasksCol = (uid: string) => collection(db, "users", uid, "tasks");

// ─── Listas ───
export function subscribeLists(
  uid: string,
  onData: (lists: TodoList[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(listsCol(uid), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TodoList)),
    onError,
  );
}

export async function createList(
  uid: string,
  input: TodoListInput,
  order: number,
) {
  return addDoc(listsCol(uid), { ...input, order, createdAt: Date.now() });
}

export async function updateList(
  uid: string,
  id: string,
  patch: Partial<TodoList>,
) {
  return updateDoc(doc(listsCol(uid), id), patch);
}

export async function deleteList(uid: string, id: string) {
  // Borra la lista y todas sus tareas
  const batch = writeBatch(db);
  batch.delete(doc(listsCol(uid), id));
  const tasksSnap = await getDocs(
    query(tasksCol(uid), where("listId", "==", id)),
  );
  tasksSnap.forEach((d) => batch.delete(d.ref));
  return batch.commit();
}

// ─── Tareas ───
export function subscribeTasks(
  uid: string,
  onData: (tasks: Task[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(tasksCol(uid), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
    onError,
  );
}

export async function createTask(uid: string, input: TaskInput, order: number) {
  const now = Date.now();
  return addDoc(tasksCol(uid), {
    title: input.title,
    description: input.description ?? "",
    listId: input.listId,
    status: input.status ?? "pending",
    dueDate: input.dueDate ?? null,
    tags: input.tags ?? [],
    subtasks: input.subtasks ?? [],
    favorite: input.favorite ?? false,
    order,
    createdAt: now,
    updatedAt: now,
    completedAt: input.status === "completed" ? now : null,
  });
}

export async function updateTask(
  uid: string,
  id: string,
  patch: Partial<Task>,
) {
  return updateDoc(doc(tasksCol(uid), id), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deleteTask(uid: string, id: string) {
  return deleteDoc(doc(tasksCol(uid), id));
}

/** Persiste el nuevo orden de un lote de tareas (drag & drop). */
export async function reorderTasks(
  uid: string,
  ordered: { id: string; order: number }[],
) {
  const batch = writeBatch(db);
  ordered.forEach(({ id, order }) => {
    batch.update(doc(tasksCol(uid), id), { order });
  });
  return batch.commit();
}
