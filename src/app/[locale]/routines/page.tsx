"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRoutines } from "@/contexts/RoutinesContext";
import { routineRunsOn, dayAggregate } from "@/utils/routineStats";
import RoutineCard from "@/components/routines/RoutineCard/RoutineCard";
import RoutineForm from "@/components/routines/RoutineForm/RoutineForm";
import RoutineStats from "@/components/routines/RoutineStats/RoutineStats";
import Button from "@/components/ui/Button/Button";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import ProgressRing from "@/components/ui/ProgressRing/ProgressRing";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { RoutinesSkeleton } from "@/components/skeletons/Skeletons";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import type { Routine } from "@/types/routine";
import "./routines.scss";

type View = "today" | "all" | "stats";

export default function RoutinesPage() {
  const t = useTranslations("routines");
  const ts = useTranslations("stats");
  const { routines, loaded, removeRoutine, getStatus } = useRoutines();

  const [view, setView] = useState<View>("today");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayRoutines = useMemo(
    () => routines.filter((r) => routineRunsOn(r, today)),
    [routines, today],
  );
  const todayAgg = useMemo(
    () => dayAggregate(routines, getStatus, today),
    [routines, getStatus, today],
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
        todayRoutines.length === 0 ? (
          <EmptyState title={t("todayEmpty")} compact />
        ) : (
          <div className="routines__today">
            <div className="routines__list">
              {todayRoutines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  mode="today"
                  showEdit
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
            <aside className="routines__today-aside">
              <div className="routines__ring-card">
                <ProgressRing
                  value={todayAgg.rate}
                  size={150}
                  label={`${todayAgg.rate}%`}
                  sublabel={t("today")}
                />
                <div className="routines__ring-counts">
                  <span>
                    <strong>{todayAgg.completed}</strong>/{todayAgg.scheduled}{" "}
                    {t("completedCount").toLowerCase()}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )
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
