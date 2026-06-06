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
  subscribeLists,
  subscribeTasks,
  createList,
  updateList,
  deleteList,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from "@/services/todos";
import type { TodoList, TodoListInput, Task, TaskInput } from "@/types/todo";

interface TodoContextType {
  lists: TodoList[];
  tasks: Task[];
  loaded: boolean;
  addList: (input: TodoListInput) => Promise<void>;
  editList: (id: string, patch: Partial<TodoList>) => Promise<void>;
  removeList: (id: string) => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  editTask: (id: string, patch: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  toggleFavorite: (task: Task) => Promise<void>;
  reorder: (ordered: { id: string; order: number }[]) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setLists([]);
      setTasks([]);
      setLoaded(false);
      return;
    }
    const uid = user.uid;
    setLoaded(false);
    let gotLists = false;
    let gotTasks = false;
    const maybeLoaded = () => {
      if (gotLists && gotTasks) setLoaded(true);
    };

    const unsubLists = subscribeLists(
      uid,
      (data) => {
        setLists(data);
        gotLists = true;
        maybeLoaded();
      },
      (err) => {
        console.error(err);
        toast("No se pudieron cargar las listas", "error");
        setLoaded(true);
      },
    );
    const unsubTasks = subscribeTasks(
      uid,
      (data) => {
        setTasks(data);
        gotTasks = true;
        maybeLoaded();
      },
      (err) => console.error(err),
    );

    return () => {
      unsubLists();
      unsubTasks();
    };
  }, [isLoggedIn, user?.uid, toast]);

  const addList = useCallback(
    async (input: TodoListInput) => {
      if (!user?.uid) return;
      try {
        await createList(user.uid, input, lists.length);
      } catch (err) {
        console.error(err);
        toast("No se pudo crear la lista", "error");
        throw err;
      }
    },
    [user?.uid, lists.length, toast],
  );

  const editList = useCallback(
    async (id: string, patch: Partial<TodoList>) => {
      if (!user?.uid) return;
      try {
        await updateList(user.uid, id, patch);
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la lista", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const removeList = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteList(user.uid, id);
      } catch (err) {
        console.error(err);
        toast("No se pudo eliminar la lista", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const addTask = useCallback(
    async (input: TaskInput) => {
      if (!user?.uid) return;
      const siblings = tasks.filter((t) => t.listId === input.listId);
      const order =
        siblings.reduce((max, t) => Math.max(max, t.order), -1) + 1;
      try {
        await createTask(user.uid, input, order);
      } catch (err) {
        console.error(err);
        toast("No se pudo crear la tarea", "error");
        throw err;
      }
    },
    [user?.uid, tasks, toast],
  );

  const editTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      if (!user?.uid) return;
      try {
        await updateTask(user.uid, id, patch);
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la tarea", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const removeTask = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteTask(user.uid, id);
      } catch (err) {
        console.error(err);
        toast("No se pudo eliminar la tarea", "error");
        throw err;
      }
    },
    [user?.uid, toast],
  );

  const toggleComplete = useCallback(
    async (task: Task) => {
      if (!user?.uid) return;
      const completed = task.status === "completed";
      try {
        await updateTask(user.uid, task.id, {
          status: completed ? "pending" : "completed",
          completedAt: completed ? null : Date.now(),
        });
      } catch (err) {
        console.error(err);
        toast("No se pudo actualizar la tarea", "error");
      }
    },
    [user?.uid, toast],
  );

  const toggleFavorite = useCallback(
    async (task: Task) => {
      if (!user?.uid) return;
      try {
        await updateTask(user.uid, task.id, { favorite: !task.favorite });
      } catch (err) {
        console.error(err);
      }
    },
    [user?.uid],
  );

  const reorder = useCallback(
    async (ordered: { id: string; order: number }[]) => {
      if (!user?.uid) return;
      try {
        await reorderTasks(user.uid, ordered);
      } catch (err) {
        console.error(err);
      }
    },
    [user?.uid],
  );

  return (
    <TodoContext.Provider
      value={{
        lists,
        tasks,
        loaded,
        addList,
        editList,
        removeList,
        addTask,
        editTask,
        removeTask,
        toggleComplete,
        toggleFavorite,
        reorder,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodo debe usarse dentro de TodoProvider");
  return ctx;
}
