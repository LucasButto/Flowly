"use client";
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRoutines } from "@/contexts/RoutinesContext";
import { routineRunsOn, dayAggregate } from "@/utils/routineStats";
import { dateKey, addDays, formatDate } from "@/utils/dates";
import RoutineCard from "@/components/routines/RoutineCard/RoutineCard";
import RoutineForm from "@/components/routines/RoutineForm/RoutineForm";
import RoutineStats from "@/components/routines/RoutineStats/RoutineStats";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import ProgressRing from "@/components/ui/ProgressRing/ProgressRing";
import MiniCalendar from "@/components/ui/MiniCalendar/MiniCalendar";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { RoutinesSkeleton } from "@/components/skeletons/Skeletons";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import type { Routine } from "@/types/routine";
import "./routines.scss";

type View = "today" | "all" | "stats";

export default function RoutinesPage() {
  const t = useTranslations("routines");
  const tc = useTranslations("common");
  const ts = useTranslations("stats");
  const locale = useLocale();
  const { routines, loaded, removeRoutine, getStatus } = useRoutines();

  const [view, setView] = useState<View>("today");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayK = dateKey(today);
  const selectedKey = dateKey(selectedDate);
  const isToday = selectedKey === todayK;

  // Rutinas que corren el día seleccionado (y que ya existían ese día)
  const dayRoutines = useMemo(
    () =>
      routines.filter(
        (r) =>
          routineRunsOn(r, selectedDate) &&
          dateKey(new Date(r.createdAt)) <= selectedKey,
      ),
    [routines, selectedDate, selectedKey],
  );
  const dayAgg = useMemo(
    () => dayAggregate(routines, getStatus, selectedDate),
    [routines, getStatus, selectedDate],
  );

  const shiftDay = (dir: number) =>
    setSelectedDate((prev) => addDays(prev, dir));

  const dayLabel = isToday
    ? tc("today")
    : selectedKey === dateKey(addDays(today, -1))
      ? tc("yesterday")
      : formatDate(
          selectedDate,
          { weekday: "short", day: "numeric", month: "long" },
          locale,
        );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: Routine) => {
    setEditing(r);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeRoutine(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (!loaded) return <RoutinesSkeleton />;

  return (
    <div className="page routines">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
        <Button icon={<AddRoundedIcon />} onClick={openNew}>
          {t("new")}
        </Button>
      </header>

      <div className="routines__tabs">
        <SegmentedControl<View>
          segments={[
            { value: "today", label: t("today") },
            { value: "all", label: t("all") },
            { value: "stats", label: ts("title") },
          ]}
          value={view}
          onChange={setView}
          fullWidth
        />
      </div>

      {routines.length === 0 ? (
        <EmptyState
          icon={<AutorenewRoundedIcon />}
          title={t("empty")}
          description={t("emptyDesc")}
          action={
            <Button icon={<AddRoundedIcon />} onClick={openNew}>
              {t("createFirst")}
            </Button>
          }
        />
      ) : view === "stats" ? (
        <RoutineStats />
      ) : view === "today" ? (
        <>
          <div className="routines__day-nav">
            <IconButton
              label={tc("back")}
              size="sm"
              variant="default"
              onClick={() => shiftDay(-1)}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <div className="routines__day-picker">
              <button
                type="button"
                className="routines__day-label"
                onClick={() => setCalOpen((o) => !o)}
                aria-expanded={calOpen}
              >
                {dayLabel}
                <EventRoundedIcon />
              </button>
              {calOpen && (
                <MiniCalendar
                  value={selectedDate}
                  onSelect={setSelectedDate}
                  onClose={() => setCalOpen(false)}
                />
              )}
            </div>
            {!isToday && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedDate(new Date())}
              >
                {tc("today")}
              </Button>
            )}
            <IconButton
              label="→"
              size="sm"
              variant="default"
              onClick={() => shiftDay(1)}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </div>

          {dayRoutines.length === 0 ? (
            <EmptyState title={t("dayEmpty")} compact />
          ) : (
            <div className="routines__today">
              <div className="routines__list">
                {dayRoutines.map((r) => (
                  <RoutineCard
                    key={r.id}
                    routine={r}
                    mode="today"
                    date={selectedKey}
                    showEdit
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
              <aside className="routines__today-aside">
                <div className="routines__ring-card">
                  <ProgressRing
                    value={dayAgg.rate}
                    size={150}
                    label={`${dayAgg.rate}%`}
                    sublabel={t("completionRate")}
                  />
                  <div className="routines__ring-counts">
                    <span>
                      {dayAgg.completed} / {dayAgg.scheduled}{" "}
                      {t("completedCount").toLowerCase()}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </>
      ) : (
        <div className="routines__grid">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              mode="all"
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <RoutineForm
        open={formOpen}
        routine={editing}
        onClose={() => setFormOpen(false)}
        onEditExisting={(r) => setEditing(r)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteTitle")}
        description={t("deleteDesc")}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
