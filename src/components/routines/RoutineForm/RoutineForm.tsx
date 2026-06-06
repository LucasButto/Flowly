"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRoutines } from "@/contexts/RoutinesContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";
import Field from "@/components/ui/Field/Field";
import TextInput from "@/components/ui/Field/TextInput";
import TextArea from "@/components/ui/Field/TextArea";
import ColorPicker from "@/components/ui/ColorPicker/ColorPicker";
import DaySelector from "@/components/routines/DaySelector/DaySelector";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { ALL_DAYS, type Weekday } from "@/types/common";
import type { Routine, RoutineFrequency, RoutineInput } from "@/types/routine";
import { DEFAULT_COLOR } from "@/utils/colors";
import { timeRangesOverlap, timeToMinutes } from "@/utils/dates";
import "./RoutineForm.scss";

interface RoutineFormProps {
  open: boolean;
  routine?: Routine | null;
  onClose: () => void;
  onEditExisting: (routine: Routine) => void;
}

interface Draft {
  name: string;
  startTime: string;
  endTime: string;
  days: Weekday[];
  frequency: RoutineFrequency;
  tag: string;
  description: string;
  color: string;
}

const emptyDraft = (): Draft => ({
  name: "",
  startTime: "08:00",
  endTime: "09:00",
  days: [...ALL_DAYS],
  frequency: "daily",
  tag: "",
  description: "",
  color: DEFAULT_COLOR,
});

export default function RoutineForm({
  open,
  routine,
  onClose,
  onEditExisting,
}: RoutineFormProps) {
  const t = useTranslations("routines");
  const tc = useTranslations("common");
  const { routines, addRoutine, editRoutine, removeRoutine } = useRoutines();
  const toast = useToast();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!routine;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConflicts([]);
    if (routine) {
      setDraft({
        name: routine.name,
        startTime: routine.startTime,
        endTime: routine.endTime,
        days: routine.days,
        frequency: routine.frequency,
        tag: routine.tag,
        description: routine.description,
        color: routine.color,
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [open, routine]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const validate = useCallback((): string | null => {
    if (!draft.name.trim()) return t("validation.nameRequired");
    if (!draft.startTime || !draft.endTime) return t("validation.timeRequired");
    if (timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime))
      return t("validation.endAfterStart");
    if (draft.days.length === 0) return t("validation.daysRequired");
    return null;
  }, [draft, t]);

  const findConflicts = useCallback((): Routine[] => {
    return routines.filter(
      (r) =>
        r.id !== routine?.id &&
        r.days.some((d) => draft.days.includes(d)) &&
        timeRangesOverlap(
          draft.startTime,
          draft.endTime,
          r.startTime,
          r.endTime,
        ),
    );
  }, [routines, routine?.id, draft]);

  const persist = useCallback(async () => {
    const payload: RoutineInput = {
      name: draft.name.trim(),
      startTime: draft.startTime,
      endTime: draft.endTime,
      days: draft.days,
      frequency: draft.frequency,
      tag: draft.tag.trim(),
      description: draft.description.trim(),
      color: draft.color,
    };
    setSaving(true);
    try {
      if (isEdit && routine) {
        await editRoutine(routine.id, payload);
        toast("Rutina actualizada", "success");
      } else {
        await addRoutine(payload);
        toast("Rutina creada", "success");
      }
      onClose();
    } catch {
      /* el contexto ya muestra el toast de error */
    } finally {
      setSaving(false);
    }
  }, [draft, isEdit, routine, editRoutine, addRoutine, toast, onClose]);

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const found = findConflicts();
    if (found.length > 0) {
      setConflicts(found);
      return;
    }
    void persist();
  };

  const handleDeleteConflict = async (id: string) => {
    await removeRoutine(id);
    const remaining = conflicts.filter((c) => c.id !== id);
    setConflicts(remaining);
    if (remaining.length === 0) void persist();
  };

  // ─── Vista de conflictos ───
  if (conflicts.length > 0) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={t("overlap.title")}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConflicts([])}>
              {t("overlap.changeNew")}
            </Button>
            <Button variant="primary" onClick={() => void persist()}>
              {t("overlap.keepBoth")}
            </Button>
          </>
        }
      >
        <div className="routine-conflicts">
          <p className="routine-conflicts__intro">
            <WarningRoundedIcon />
            {t("overlap.desc", {
              names: conflicts.map((c) => c.name).join(", "),
            })}
          </p>
          <ul className="routine-conflicts__list">
            {conflicts.map((c) => (
              <li key={c.id} className="routine-conflicts__item">
                <span
                  className="routine-conflicts__dot"
                  style={{ background: c.color }}
                />
                <div className="routine-conflicts__info">
                  <span className="routine-conflicts__name">{c.name}</span>
                  <span className="routine-conflicts__time">
                    {c.startTime}–{c.endTime}
                  </span>
                </div>
                <div className="routine-conflicts__actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEditExisting(c)}
                  >
                    {tc("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteConflict(c.id)}
                  >
                    {tc("delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    );
  }

  // ─── Formulario ───
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("edit") : t("new")}
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
      <div className="routine-form">
        <Field label={t("fieldName")} error={error ?? undefined}>
          <TextInput
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("fieldNamePlaceholder")}
            autoFocus
          />
        </Field>

        <div className="routine-form__row">
          <Field label={t("startTime")}>
            <TextInput
              type="time"
              value={draft.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
          </Field>
          <Field label={t("endTime")}>
            <TextInput
              type="time"
              value={draft.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </Field>
        </div>

        <Field label={t("executionDays")}>
          <DaySelector
            days={draft.days}
            frequency={draft.frequency}
            onChange={(days, frequency) =>
              setDraft((d) => ({ ...d, days, frequency }))
            }
          />
        </Field>

        <Field label={tc("tag")} optional>
          <TextInput
            value={draft.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder={t("fieldTagPlaceholder")}
          />
        </Field>

        <Field label={tc("color")}>
          <ColorPicker value={draft.color} onChange={(c) => set("color", c)} />
        </Field>

        <Field label={tc("description")} optional>
          <TextArea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t("fieldDescPlaceholder")}
          />
        </Field>
      </div>
    </Modal>
  );
}
