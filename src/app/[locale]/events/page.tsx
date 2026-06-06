"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useEvents } from "@/contexts/EventsContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import {
  weekDays,
  startOfWeek,
  addDays,
  formatDate,
  parseDateKey,
} from "@/utils/dates";
import { eventsOnDate } from "@/utils/events";
import MonthView from "@/components/events/MonthView/MonthView";
import TimeGrid from "@/components/events/TimeGrid/TimeGrid";
import YearView from "@/components/events/YearView/YearView";
import EventForm from "@/components/events/EventForm/EventForm";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import { EventsSkeleton } from "@/components/skeletons/Skeletons";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import Modal from "@/components/ui/Modal/Modal";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import type { FlowEvent } from "@/types/event";
import "./events.scss";

type View = "day" | "week" | "month" | "year";

export default function EventsPage() {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const toast = useToast();
  const {
    events,
    loaded,
    editEvent,
    removeEvent,
    importFromGoogle,
    exportToGoogle,
  } = useEvents();

  const [view, setView] = useState<View>("month");
  const [googleOpen, setGoogleOpen] = useState(false);
  const [syncing, setSyncing] = useState<"import" | "export" | null>(null);

  const runSync = async (mode: "import" | "export") => {
    setSyncing(mode);
    try {
      const n =
        mode === "import" ? await importFromGoogle() : await exportToGoogle();
      toast(
        n > 0
          ? t(mode === "import" ? "googleImported" : "googleExported", {
              count: n,
            })
          : t("googleNone"),
        "success",
      );
      setGoogleOpen(false);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        console.error(err);
        toast(t("googleError"), "error");
      }
    } finally {
      setSyncing(null);
    }
  };
  const [cursor, setCursor] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FlowEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [detail, setDetail] = useState<FlowEvent | null>(null);
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlowEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [editOneDate, setEditOneDate] = useState<string | null>(null);
  const [scope, setScope] = useState<{
    action: "edit" | "delete";
    event: FlowEvent;
    date: string;
  } | null>(null);

  // Click en un día: si hay eventos abre el modal del día; si no, el form nuevo
  const handleDayClick = (key: string) => {
    const dayEvents = eventsOnDate(events, parseDateKey(key));
    if (dayEvents.length > 0) setDayModal(key);
    else openNew(key);
  };

  const dayModalEvents = dayModal
    ? eventsOnDate(events, parseDateKey(dayModal)).sort((a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
      )
    : [];

  const shift = (dir: number) =>
    setCursor((prev) => {
      const d = new Date(prev);
      if (view === "day") d.setDate(d.getDate() + dir);
      else if (view === "week") d.setDate(d.getDate() + 7 * dir);
      else if (view === "year") d.setFullYear(d.getFullYear() + dir);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });

  const title = useMemo(() => {
    if (view === "year") return String(cursor.getFullYear());
    if (view === "day")
      return formatDate(cursor, {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    if (view === "week") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      return `${formatDate(ws, { day: "numeric", month: "short" })} – ${formatDate(
        we,
        { day: "numeric", month: "short", year: "numeric" },
      )}`;
    }
    return `${formatDate(cursor, { month: "long" })} ${cursor.getFullYear()}`;
  }, [view, cursor]);

  const openNew = (date?: string) => {
    setEditing(null);
    setEditOneDate(null);
    setDefaultDate(date);
    setFormOpen(true);
  };
  const openEdit = (ev: FlowEvent) => {
    setDetail(null);
    setEditing(ev);
    setEditOneDate(null);
    setDefaultDate(undefined);
    setFormOpen(true);
  };
  const openEditOne = (ev: FlowEvent, date: string) => {
    setDetail(null);
    setEditing(ev);
    setEditOneDate(date);
    setDefaultDate(undefined);
    setFormOpen(true);
  };
  const openDetail = (ev: FlowEvent, date: string) => {
    setDetail(ev);
    setDetailDate(date);
  };

  // Editar/eliminar desde el detalle: si es recurrente, preguntar el alcance
  const handleEditFromDetail = () => {
    if (!detail) return;
    const date = detailDate ?? detail.date;
    if (detail.recurrence !== "none") {
      setScope({ action: "edit", event: detail, date });
      setDetail(null);
    } else {
      openEdit(detail);
    }
  };
  const handleDeleteFromDetail = () => {
    if (!detail) return;
    const date = detailDate ?? detail.date;
    if (detail.recurrence !== "none") {
      setScope({ action: "delete", event: detail, date });
      setDetail(null);
    } else {
      setDeleteTarget(detail);
    }
  };

  const applyScope = async (which: "one" | "all") => {
    if (!scope) return;
    const { action, event, date } = scope;
    if (action === "delete") {
      if (which === "all") await removeEvent(event.id);
      else
        await editEvent(event.id, {
          excludedDates: [...(event.excludedDates ?? []), date],
        });
      setScope(null);
    } else {
      const ev = event;
      const d = date;
      setScope(null);
      if (which === "all") openEdit(ev);
      else openEditOne(ev, d);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeEvent(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    setDetail(null);
  };

  if (!loaded) return <EventsSkeleton />;

  return (
    <div className="page events">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
        <div className="events__header-actions">
          <Button
            variant="secondary"
            icon={
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/google-icon.svg" alt="" width={18} height={18} />
            }
            onClick={() => setGoogleOpen(true)}
          >
            {t("google")}
          </Button>
          <Button icon={<AddRoundedIcon />} onClick={() => openNew()}>
            {t("new")}
          </Button>
        </div>
      </header>

      <div className="events__toolbar">
        <div className="events__nav">
          <IconButton label={tc("back")} size="sm" onClick={() => shift(-1)}>
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            {t("today")}
          </Button>
          <IconButton label="→" size="sm" onClick={() => shift(1)}>
            <ChevronRightRoundedIcon />
          </IconButton>
          <h2 className="events__period">{title}</h2>
        </div>
        <SegmentedControl<View>
          segments={[
            { value: "day", label: t("day") },
            { value: "week", label: t("week") },
            { value: "month", label: t("month") },
            { value: "year", label: t("year") },
          ]}
          value={view}
          onChange={setView}
          size="sm"
        />
      </div>

      {view === "month" ? (
        <MonthView
          monthDate={cursor}
          events={events}
          onSelectDate={handleDayClick}
          onSelectEvent={openDetail}
        />
      ) : view === "year" ? (
        <YearView
          monthDate={cursor}
          events={events}
          onSelectDate={handleDayClick}
          onSelectMonth={(d) => {
            setCursor(d);
            setView("month");
          }}
        />
      ) : (
        <TimeGrid
          days={view === "day" ? [cursor] : weekDays(cursor)}
          events={events}
          onSelectDate={handleDayClick}
          onSelectEvent={openDetail}
        />
      )}

      <EventForm
        open={formOpen}
        event={editing}
        defaultDate={defaultDate}
        editOneDate={editOneDate}
        onClose={() => setFormOpen(false)}
      />

      {/* Detalle rápido del evento */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title}
        size="sm"
        footer={
          <>
            <Button
              variant="danger"
              icon={<DeleteOutlineRoundedIcon />}
              onClick={handleDeleteFromDetail}
            >
              {tc("delete")}
            </Button>
            <Button
              variant="primary"
              icon={<EditRoundedIcon />}
              onClick={handleEditFromDetail}
            >
              {tc("edit")}
            </Button>
          </>
        }
      >
        {detail && (
          <div className="events__detail">
            <p className="events__detail-when">
              {formatDate(parseDateKey(detailDate ?? detail.date), {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {detail.startTime
                ? ` · ${detail.startTime}${detail.endTime ? "–" + detail.endTime : ""}`
                : ` · ${t("allDay")}`}
            </p>
            {detail.location && (
              <p className="events__detail-loc">
                <PlaceRoundedIcon /> {detail.location}
              </p>
            )}
            {detail.description && (
              <p className="events__detail-desc">{detail.description}</p>
            )}
            {detail.tags.length > 0 && (
              <div className="events__detail-tags">
                {detail.tags.map((tag) => (
                  <span key={tag} className="chip">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal del día (cuando hay eventos) */}
      <Modal
        open={!!dayModal}
        onClose={() => setDayModal(null)}
        title={
          dayModal
            ? formatDate(parseDateKey(dayModal), {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : ""
        }
        size="sm"
        footer={
          <Button
            variant="primary"
            icon={<AddRoundedIcon />}
            onClick={() => {
              const key = dayModal;
              setDayModal(null);
              if (key) openNew(key);
            }}
          >
            {t("new")}
          </Button>
        }
      >
        <ul className="events__day-list">
          {dayModalEvents.map((ev) => (
            <li key={ev.id}>
              <button
                className="events__day-item"
                style={{ "--ev": ev.color } as React.CSSProperties}
                onClick={() => {
                  const k = dayModal;
                  setDayModal(null);
                  if (k) openDetail(ev, k);
                }}
              >
                <span className="events__day-time">
                  {ev.startTime ? ev.startTime : t("allDay")}
                </span>
                <span className="events__day-title">{ev.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Sincronización con Google Calendar */}
      <Modal
        open={googleOpen}
        onClose={() => setGoogleOpen(false)}
        title={t("google")}
        size="sm"
        footer={
          <Button variant="ghost" onClick={() => setGoogleOpen(false)}>
            {tc("close")}
          </Button>
        }
      >
        <div className="events__google">
          <p className="events__google-note">{t("googleNote")}</p>
          <Button
            variant="secondary"
            fullWidth
            icon={<CloudDownloadRoundedIcon />}
            loading={syncing === "import"}
            disabled={syncing !== null}
            onClick={() => runSync("import")}
          >
            {t("googleImport")}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            icon={<CloudUploadRoundedIcon />}
            loading={syncing === "export"}
            disabled={syncing !== null}
            onClick={() => runSync("export")}
          >
            {t("googleExport")}
          </Button>
        </div>
      </Modal>

      {/* Alcance de recurrencia (editar/eliminar este vs todos) */}
      <Modal
        open={!!scope}
        onClose={() => setScope(null)}
        title={scope?.action === "delete" ? t("deleteTitle") : t("edit")}
        size="sm"
        footer={
          <Button variant="ghost" onClick={() => setScope(null)}>
            {tc("cancel")}
          </Button>
        }
      >
        <div className="events__google">
          <p className="events__google-note">
            {scope?.action === "delete"
              ? t("recurringDeletePrompt")
              : t("recurringEditPrompt")}
          </p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => void applyScope("one")}
          >
            {t("scopeOne")}
          </Button>
          <Button
            variant={scope?.action === "delete" ? "danger" : "primary"}
            fullWidth
            onClick={() => void applyScope("all")}
          >
            {t("scopeAll")}
          </Button>
        </div>
      </Modal>

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
