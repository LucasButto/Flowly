"use client";
import { useState, useEffect, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useEvents } from "@/contexts/EventsContext";
import { eventConflicts } from "@/utils/events";
import {
  timeToMinutes,
  todayKey,
  parseDateKey,
  formatDate,
} from "@/utils/dates";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";
import Field from "@/components/ui/Field/Field";
import TextInput from "@/components/ui/Field/TextInput";
import TextArea from "@/components/ui/Field/TextArea";
import Select from "@/components/ui/Field/Select";
import Switch from "@/components/ui/Switch/Switch";
import ColorPicker from "@/components/ui/ColorPicker/ColorPicker";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { DEFAULT_COLOR } from "@/utils/colors";
import type { FlowEvent, EventInput, EventRecurrence } from "@/types/event";
import "./EventForm.scss";

interface EventFormProps {
  open: boolean;
  event?: FlowEvent | null;
  defaultDate?: string;
  /** Si está seteado, edita SOLO esa ocurrencia: crea un evento suelto y
   *  excluye esa fecha del evento recurrente original. */
  editOneDate?: string | null;
  onClose: () => void;
}

const REMINDER_OPTIONS: { value: string; key: string }[] = [
  { value: "", key: "reminderNone" },
  { value: "0", key: "reminderAt" },
  { value: "5", key: "reminder5" },
  { value: "10", key: "reminder10" },
  { value: "15", key: "reminder15" },
  { value: "30", key: "reminder30" },
  { value: "60", key: "reminder60" },
  { value: "1440", key: "reminder1440" },
];

export default function EventForm({
  open,
  event,
  defaultDate,
  editOneDate,
  onClose,
}: EventFormProps) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const { events, addEvent, editEvent } = useEvents();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [recurrence, setRecurrence] = useState<EventRecurrence>("none");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [businessDayOffset, setBusinessDayOffset] = useState(1);
  const [reminder, setReminder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<FlowEvent[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!event;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConflicts([]);
    setTagDraft("");
    if (event) {
      setTitle(event.title);
      setDate(editOneDate ?? event.date);
      setAllDay(!event.startTime);
      setStartTime(event.startTime ?? "09:00");
      setEndTime(event.endTime ?? "10:00");
      setLocation(event.location);
      setDescription(event.description);
      setTags(event.tags);
      setColor(event.color);
      // Al editar "solo este", se vuelve un evento suelto (sin recurrencia)
      setRecurrence(editOneDate ? "none" : event.recurrence);
      setRecurrenceEnd(editOneDate ? "" : (event.recurrenceEnd ?? ""));
      setBusinessDayOffset(event.businessDayOffset ?? 1);
      setReminder(
        event.reminderMinutes != null ? String(event.reminderMinutes) : "",
      );
    } else {
      setTitle("");
      setDate(defaultDate ?? todayKey());
      setAllDay(false);
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setDescription("");
      setTags([]);
      setColor(DEFAULT_COLOR);
      setRecurrence("none");
      setRecurrenceEnd("");
      setBusinessDayOffset(1);
      setReminder("");
    }
  }, [open, event, defaultDate, editOneDate]);

  const addTag = () => {
    const v = tagDraft.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags((p) => [...p, v]);
    setTagDraft("");
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((p) => p.slice(0, -1));
    }
  };

  const buildPayload = (): EventInput => ({
    title: title.trim(),
    date,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
    location: location.trim(),
    description: description.trim(),
    tags,
    color,
    recurrence,
    recurrenceEnd:
      recurrence !== "none" && recurrenceEnd ? recurrenceEnd : null,
    businessDayOffset: recurrence === "businessDay" ? businessDayOffset : null,
    reminderMinutes: reminder === "" ? null : Number(reminder),
  });

  const persist = async () => {
    setSaving(true);
    try {
      if (editOneDate && event) {
        // Editar solo esta ocurrencia: crear evento suelto + excluir la fecha
        await addEvent(buildPayload());
        await editEvent(event.id, {
          excludedDates: [...(event.excludedDates ?? []), editOneDate],
        });
      } else if (isEdit && event) {
        await editEvent(event.id, buildPayload());
      } else {
        await addEvent(buildPayload());
      }
      onClose();
    } catch {
      /* toast en contexto */
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return setError(t("validation.titleRequired"));
    if (!date) return setError(t("validation.dateRequired"));
    if (!allDay && timeToMinutes(endTime) <= timeToMinutes(startTime))
      return setError(t("validation.endAfterStart"));
    setError(null);

    const found = eventConflicts(
      events,
      {
        date,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
      },
      event?.id,
    );
    if (found.length > 0) {
      setConflicts(found);
      return;
    }
    void persist();
  };

  // ─── Panel de conflicto ───
  if (conflicts.length > 0) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={t("conflictTitle")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConflicts([])}>
              {tc("back")}
            </Button>
            <Button variant="primary" onClick={() => void persist()}>
              {t("keepAnyway")}
            </Button>
          </>
        }
      >
        <p className="event-form__conflict">
          <WarningRoundedIcon />
          {t("conflictDesc", {
            names: conflicts.map((c) => c.title).join(", "),
          })}
        </p>
      </Modal>
    );
  }

  const formTitle = isEdit
    ? t("edit")
    : date
      ? `${t("new")} - ${formatDate(parseDateKey(date), {
          day: "numeric",
          month: "long",
        })}`
      : t("new");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formTitle}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? tc("saveChanges") : tc("create")}
          </Button>
        </>
      }
    >
      <div className="event-form">
        <Field label={t("fieldTitle")} error={error ?? undefined}>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("fieldTitlePlaceholder")}
            autoFocus
          />
        </Field>

        <div className="event-form__row">
          <Field label={t("date")}>
            <TextInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={t("allDay")}>
            <div className="event-form__allday">
              <Switch
                checked={allDay}
                onChange={setAllDay}
                label={t("allDay")}
              />
              <span>{t("allDay")}</span>
            </div>
          </Field>
        </div>

        {!allDay && (
          <div className="event-form__row">
            <Field label={t("startTime")}>
              <TextInput
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field label={t("endTime")}>
              <TextInput
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>
        )}

        <Field label={t("location")} optional>
          <TextInput
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("locationPlaceholder")}
          />
        </Field>

        <div className="event-form__row">
          <Field label={t("recurrence")}>
            <Select
              value={recurrence}
              onChange={(v) => setRecurrence(v as EventRecurrence)}
            >
              <option value="none">{t("recurrenceNone")}</option>
              <option value="daily">{t("recurrenceDaily")}</option>
              <option value="weekly">{t("recurrenceWeekly")}</option>
              <option value="monthly">{t("recurrenceMonthly")}</option>
              <option value="yearly">{t("recurrenceYearly")}</option>
              <option value="businessDay">{t("recurrenceBusinessDay")}</option>
            </Select>
          </Field>
          {recurrence !== "none" && (
            <Field label={t("recurrenceEnd")} optional>
              <TextInput
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
              />
            </Field>
          )}
        </div>

        {recurrence === "businessDay" && (
          <Field label={t("businessDayLabel")} hint={t("businessDayHint")}>
            <Select
              value={String(businessDayOffset)}
              onChange={(v) => setBusinessDayOffset(Number(v))}
            >
              <option value="1">{t("bd1")}</option>
              <option value="2">{t("bd2")}</option>
              <option value="3">{t("bd3")}</option>
              <option value="4">{t("bd4")}</option>
              <option value="5">{t("bd5")}</option>
              <option value="-1">{t("bdLast1")}</option>
              <option value="-2">{t("bdLast2")}</option>
              <option value="-3">{t("bdLast3")}</option>
            </Select>
          </Field>
        )}

        <Field label={t("reminder")}>
          <Select value={reminder} onChange={(v) => setReminder(v)}>
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.key)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={tc("color")}>
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <Field label={tc("tags")} optional>
          <div className="event-form__tags">
            {tags.map((tag) => (
              <span key={tag} className="event-form__tag">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((p) => p.filter((x) => x !== tag))}
                  aria-label={tc("delete")}
                >
                  <CloseRoundedIcon />
                </button>
              </span>
            ))}
            <input
              className="event-form__tag-input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={addTag}
              placeholder="+"
            />
          </div>
        </Field>

        <Field label={tc("description")} optional>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
          />
        </Field>
      </div>
    </Modal>
  );
}
