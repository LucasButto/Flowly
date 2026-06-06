export type TaskStatus = "pending" | "completed";

export interface TodoList {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: number;
}

export type TodoListInput = Omit<TodoList, "id" | "order" | "createdAt">;

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null; // "YYYY-MM-DD"
  tags: string[];
  subtasks: Subtask[];
  favorite: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export type TaskInput = Omit<
  Task,
  "id" | "order" | "createdAt" | "updatedAt" | "completedAt" | "status" | "favorite"
> &
  Partial<Pick<Task, "status" | "favorite">>;
