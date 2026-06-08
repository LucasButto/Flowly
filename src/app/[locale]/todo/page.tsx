"use client";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTodo } from "@/contexts/TodoContext";
import ListSidebar from "@/components/todo/ListSidebar/ListSidebar";
import TaskItem from "@/components/todo/TaskItem/TaskItem";
import TaskForm from "@/components/todo/TaskForm/TaskForm";
import ListForm from "@/components/todo/ListForm/ListForm";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import Select from "@/components/ui/Field/Select";
import Switch from "@/components/ui/Switch/Switch";
import ProgressBar from "@/components/ui/ProgressBar/ProgressBar";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { TodoSkeleton } from "@/components/skeletons/Skeletons";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { Task, TaskStatus, TodoList } from "@/types/todo";
import "./todo.scss";

type StatusFilter = TaskStatus | "all";
const SMART = ["all", "favorites", "history"];

export default function TodoPage() {
  const t = useTranslations("todo");
  const tc = useTranslations("common");
  const tst = useTranslations("status");
  const { lists, tasks, loaded, removeTask, removeList, reorder } = useTodo();

  // "all" = vista resumen de listas; o "favorites" | "history" | listId
  const [selected, setSelected] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // Las tareas completadas quedan visibles (tachadas) por defecto; el usuario
  // las borra con el tacho. El toggle permite ocultarlas si quiere.
  const [showCompleted, setShowCompleted] = useState(true);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [listFormOpen, setListFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [deleteList, setDeleteList] = useState<TodoList | null>(null);
  const [busy, setBusy] = useState(false);

  // Si la lista seleccionada se elimina, volver al resumen
  useEffect(() => {
    if (!SMART.includes(selected) && !lists.some((l) => l.id === selected)) {
      setSelected("all");
    }
  }, [lists, selected]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isOverview = selected === "all";
  const isRealList = !SMART.includes(selected);
  const filtersActive = !!search || statusFilter !== "all";
  const dndEnabled = isRealList && !filtersActive;

  const heading = useMemo(() => {
    if (selected === "favorites") return t("favorites");
    if (selected === "history") return t("history");
    return lists.find((l) => l.id === selected)?.name ?? "";
  }, [selected, lists, t]);

  const openNewList = () => {
    setEditingList(null);
    setListFormOpen(true);
  };

  const visibleTasks = useMemo(() => {
    if (isOverview) return [];
    let base = tasks;
    if (selected === "favorites") base = base.filter((x) => x.favorite);
    else if (selected === "history")
      base = base.filter((x) => x.status === "completed");
    else base = base.filter((x) => x.listId === selected);

    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.description.toLowerCase().includes(q) ||
          x.tags.some((tag) => tag.includes(q)),
      );
    }
    if (statusFilter !== "all")
      base = base.filter((x) => x.status === statusFilter);

    if (selected === "history") {
      return [...base].sort(
        (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0),
      );
    }
    if (!showCompleted) base = base.filter((x) => x.status !== "completed");

    return [...base].sort((a, b) => a.order - b.order);
  }, [tasks, selected, isOverview, search, statusFilter, showCompleted]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visibleTasks.map((x) => x.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(visibleTasks, oldIndex, newIndex);
    reorder(reordered.map((x, i) => ({ id: x.id, order: i })));
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskFormOpen(true);
  };
  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTask) return;
    setBusy(true);
    await removeTask(deleteTask.id);
    setBusy(false);
    setDeleteTask(null);
  };
  const confirmDeleteList = async () => {
    if (!deleteList) return;
    setBusy(true);
    await removeList(deleteList.id);
    setBusy(false);
    setDeleteList(null);
  };

  const defaultListId = isRealList ? selected : lists[0]?.id;

  if (!loaded) return <TodoSkeleton />;

  return (
    <div className="page todo">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
        {lists.length > 0 &&
          (isOverview ? (
            <Button icon={<AddRoundedIcon />} onClick={openNewList}>
              {t("newList")}
            </Button>
          ) : (
            <Button icon={<AddRoundedIcon />} onClick={openNewTask}>
              {t("newTask")}
            </Button>
          ))}
      </header>

      <div className="todo__layout">
        <ListSidebar
          selected={selected}
          onSelect={setSelected}
          onNewList={openNewList}
          onEditList={(l) => {
            setEditingList(l);
            setListFormOpen(true);
          }}
          onDeleteList={setDeleteList}
        />

        <section className="todo__main">
          {lists.length === 0 ? (
            <EmptyState
              icon={<ChecklistRoundedIcon />}
              title={t("noLists")}
              description={t("emptyList")}
              action={
                <Button icon={<AddRoundedIcon />} onClick={openNewList}>
                  {t("newList")}
                </Button>
              }
            />
          ) : isOverview ? (
            /* ─── Resumen de listas ─── */
            <div className="todo__overview">
              {lists.map((l) => {
                const listTasks = tasks.filter((x) => x.listId === l.id);
                const done = listTasks.filter(
                  (x) => x.status === "completed",
                ).length;
                const pending = listTasks.length - done;
                const pct =
                  listTasks.length === 0
                    ? 0
                    : Math.round((done / listTasks.length) * 100);
                return (
                  <button
                    key={l.id}
                    className="todo__list-card"
                    onClick={() => setSelected(l.id)}
                    style={{ "--list": l.color } as React.CSSProperties}
                  >
                    <div className="todo__list-card-top">
                      <span className="todo__list-dot" />
                      <h3 className="todo__list-name">{l.name}</h3>
                      <ChevronRightRoundedIcon className="todo__list-chevron" />
                    </div>
                    <p className="todo__list-count">
                      {t("tasksCount", { count: listTasks.length })}
                      {pending > 0 &&
                        ` · ${t("pendingCount", { count: pending })}`}
                    </p>
                    <ProgressBar value={pct} color="var(--list)" height={6} />
                  </button>
                );
              })}
              <button
                className="todo__list-card todo__list-card--add"
                onClick={openNewList}
              >
                <AddRoundedIcon />
                <span>{t("newList")}</span>
              </button>
            </div>
          ) : (
            /* ─── Tareas de una lista / favoritas / historial ─── */
            <>
              <div className="todo__toolbar">
                <button
                  className="todo__back"
                  onClick={() => setSelected("all")}
                  aria-label={tc("back")}
                >
                  <ArrowBackRoundedIcon />
                  <h2 className="todo__heading">{heading}</h2>
                </button>
                {isRealList && (
                  <IconButton
                    label={t("editList")}
                    size="sm"
                    onClick={() => {
                      const l = lists.find((x) => x.id === selected);
                      if (l) {
                        setEditingList(l);
                        setListFormOpen(true);
                      }
                    }}
                  >
                    <EditRoundedIcon />
                  </IconButton>
                )}
                <div className="todo__search">
                  <SearchRoundedIcon />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <option value="all">{t("allTasks")}</option>
                  <option value="pending">{tst("pending")}</option>
                  <option value="completed">{tst("completed")}</option>
                </Select>
                {selected !== "history" && (
                  <label className="todo__toggle">
                    <Switch
                      checked={showCompleted}
                      onChange={setShowCompleted}
                    />
                    <span>{t("showCompleted")}</span>
                  </label>
                )}
              </div>

              {visibleTasks.length === 0 ? (
                <EmptyState
                  icon={<ChecklistRoundedIcon />}
                  title={
                    selected === "history" ? t("historyEmpty") : t("empty")
                  }
                  description={
                    selected === "history" ? undefined : t("emptyDesc")
                  }
                  action={
                    isRealList ? (
                      <Button
                        variant="secondary"
                        icon={<AddRoundedIcon />}
                        onClick={openNewTask}
                      >
                        {t("newTask")}
                      </Button>
                    ) : undefined
                  }
                  compact
                />
              ) : dndEnabled ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={visibleTasks.map((x) => x.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="todo__tasks">
                      {visibleTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          sortable
                          onEdit={openEditTask}
                          onDelete={setDeleteTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="todo__tasks">
                  {visibleTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onEdit={openEditTask}
                      onDelete={setDeleteTask}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        defaultListId={defaultListId}
        onClose={() => setTaskFormOpen(false)}
      />
      <ListForm
        open={listFormOpen}
        list={editingList}
        onClose={() => setListFormOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteTask}
        title={t("deleteTaskTitle")}
        loading={busy}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTask(null)}
      />
      <ConfirmDialog
        open={!!deleteList}
        title={t("deleteListTitle")}
        description={t("deleteListDesc")}
        loading={busy}
        onConfirm={confirmDeleteList}
        onCancel={() => setDeleteList(null)}
      />
    </div>
  );
}
