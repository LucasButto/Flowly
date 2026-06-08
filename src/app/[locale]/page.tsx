"use client";
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoutines } from "@/contexts/RoutinesContext";
import { useTodo } from "@/contexts/TodoContext";
import { useEvents } from "@/contexts/EventsContext";
import { routineRunsOn } from "@/utils/routineStats";
import { occurrencesInRange } from "@/utils/events";
import {
  addDays,
  dateKey,
  parseDateKey,
  getGreetingKey,
  formatDate,
} from "@/utils/dates";
import StatCard from "@/components/dashboard/StatCard/StatCard";
import NextEventCard from "@/components/dashboard/NextEventCard/NextEventCard";
import Clock from "@/components/dashboard/Clock/Clock";
import RoutineCard from "@/components/routines/RoutineCard/RoutineCard";
import TaskItem from "@/components/todo/TaskItem/TaskItem";
import TaskForm from "@/components/todo/TaskForm/TaskForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { Task } from "@/types/todo";
import "./dashboard.scss";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tt = useTranslations("todo");
  const locale = useLocale();
  const { user } = useAuth();
  const { routines, getStatus, loaded: routinesLoaded } = useRoutines();
  const { tasks, loaded: todoLoaded, removeTask } = useTodo();
  const { events, loaded: eventsLoaded } = useEvents();

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayK = dateKey(today);

  const todayRoutines = useMemo(
    () => routines.filter((r) => routineRunsOn(r, today)),
    [routines, today],
  );
  const completedCount = todayRoutines.filter(
    (r) => getStatus(r.id, todayK) === "completed",
  ).length;
  const pendingCount = todayRoutines.filter(
    (r) => getStatus(r.id, todayK) === "pending",
  ).length;

  const pendingTasks = useMemo(
    () => tasks.filter((x) => x.status !== "completed"),
    [tasks],
  );

  // Solo tareas con vencimiento hoy
  const todayTasks = useMemo(
    () =>
      pendingTasks
        .filter((x) => x.dueDate === todayK)
        .sort((a, b) => a.order - b.order),
    [pendingTasks, todayK],
  );

  // Evento más próximo (hoy en adelante)
  const nextEvent = useMemo(() => {
    const occ = occurrencesInRange(events, today, addDays(today, 365));
    const now = today.getTime();
    let best: { event: (typeof events)[number]; date: string } | null = null;
    let bestKey = Infinity;
    for (const { event, date } of occ) {
      let sortKey: number;
      if (event.startTime) {
        const d = parseDateKey(date);
        const [h, m] = event.startTime.split(":").map(Number);
        d.setHours(h ?? 0, m ?? 0, 0, 0);
        if (d.getTime() < now) continue; // ya pasó hoy
        sortKey = d.getTime();
      } else {
        if (date < todayK) continue;
        const d = parseDateKey(date);
        d.setHours(0, 0, 0, 0);
        sortKey = d.getTime();
      }
      if (sortKey < bestKey) {
        bestKey = sortKey;
        best = { event, date };
      }
    }
    return best;
  }, [events, today, todayK]);

  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };
  const confirmDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    setDeletingTask(true);
    await removeTask(deleteTaskTarget.id);
    setDeletingTask(false);
    setDeleteTaskTarget(null);
  };

  if (!routinesLoaded || !todoLoaded || !eventsLoaded) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page dashboard">
      <header className="dashboard__hero">
        <h1 className="dashboard__greeting">
          {t(`greeting${cap(getGreetingKey(today))}`)}
          {firstName && <span> {firstName}</span>}
        </h1>
        <p className="dashboard__date">
          {formatDate(
            today,
            { weekday: "long", day: "numeric", month: "long" },
            locale,
          )}
        </p>
        <Clock />
      </header>

      {/* Resumen de hoy */}
      <section className="dashboard__section">
        <h2 className="section-title">{t("todaySummary")}</h2>
        <div className="dashboard__stats">
          <StatCard
            icon={<PendingActionsRoundedIcon />}
            value={pendingCount}
            label={t("routinesPending")}
            accent="var(--info)"
            href="/routines"
          />
          <StatCard
            icon={<CheckCircleRoundedIcon />}
            value={completedCount}
            label={t("routinesCompleted")}
            accent="var(--success)"
            href="/routines"
          />
          <StatCard
            icon={<ChecklistRoundedIcon />}
            value={pendingTasks.length}
            label={t("tasksPending")}
            accent="var(--brand)"
            href="/todo"
          />
          <NextEventCard
            event={nextEvent?.event ?? null}
            date={nextEvent?.date ?? null}
            href="/events"
          />
        </div>
      </section>

      <div className="dashboard__columns">
        {/* Rutinas de hoy */}
        <section className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h2 className="section-title">{t("todayRoutines")}</h2>
            <Link href="/routines" className="dashboard__link">
              {t("viewAll")} <ArrowForwardRoundedIcon />
            </Link>
          </div>
          {todayRoutines.length === 0 ? (
            <EmptyState title={t("nothingToday")} compact />
          ) : (
            <div className="dashboard__routines">
              {todayRoutines.slice(0, 4).map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  mode="today"
                  openHref="/routines"
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tareas de hoy */}
        <section className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h2 className="section-title">{t("todayTasks")}</h2>
            <Link href="/todo" className="dashboard__link">
              {t("viewAll")} <ArrowForwardRoundedIcon />
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <EmptyState title={t("nothingToday")} compact />
          ) : (
            <div className="dashboard__tasks">
              {todayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={openEditTask}
                  onDelete={setDeleteTaskTarget}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        onClose={() => setTaskFormOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteTaskTarget}
        title={tt("deleteTaskTitle")}
        loading={deletingTask}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTaskTarget(null)}
      />
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
