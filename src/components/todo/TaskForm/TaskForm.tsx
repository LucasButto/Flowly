"use client";
import { useState, useEffect, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useTodo } from "@/contexts/TodoContext";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";
import Field from "@/components/ui/Field/Field";
import TextInput from "@/components/ui/Field/TextInput";
import TextArea from "@/components/ui/Field/TextArea";
import Select from "@/components/ui/Field/Select";
import IconButton from "@/components/ui/IconButton/IconButton";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import type { Task, Subtask } from "@/types/todo";
import { newId } from "@/utils/ids";
import "./TaskForm.scss";

interface TaskFormProps {
  open: boolean;
  task?: Task | null;
  defaultListId?: string;
  onClose: () => void;
}

export default function TaskForm({
  open,
  task,
  defaultListId,
  onClose,
}: TaskFormProps) {
  const t = useTranslations("todo");
  const tc = useTranslations("common");
  const { lists, addTask, editTask } = useTodo();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subDraft, setSubDraft] = useState("");
  const [listId, setListId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!task;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTagDraft("");
    setSubDraft("");
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate ?? "");
      setTags(task.tags);
      setSubtasks(task.subtasks);
      setListId(task.listId);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setTags([]);
      setSubtasks([]);
      setListId(defaultListId ?? lists[0]?.id ?? "");
    }
  }, [open, task, defaultListId, lists]);

  const addTag = () => {
    const v = tagDraft.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags((prev) => [...prev, v]);
    setTagDraft("");
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const addSubtask = () => {
    const v = subDraft.trim();
    if (!v) return;
    setSubtasks((prev) => [...prev, { id: newId(), title: v, done: false }]);
    setSubDraft("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t("validation.titleRequired"));
      return;
    }
    if (!listId) {
      setError(t("validation.listNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        listId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        tags,
        subtasks,
      };
      if (isEdit && task) await editTask(task.id, payload);
      else await addTask(payload);
      onClose();
    } catch {
      /* toast en contexto */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("editTask") : t("newTask")}
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
      <div className="task-form">
        <Field label={t("taskTitle")} error={error ?? undefined}>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("taskTitlePlaceholder")}
            autoFocus
          />
        </Field>

        <Field label={tc("description")} optional>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="task-form__row">
          <Field label={t("lists")}>
            <Select value={listId} onChange={(v) => setListId(v)}>
              {lists.length === 0 && <option value="">—</option>}
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("dueDate")} optional>
            <TextInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label={tc("tags")} optional>
          <div className="task-form__tags">
            {tags.map((tag) => (
              <span key={tag} className="task-form__tag">
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
              className="task-form__tag-input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={addTag}
              placeholder="+"
            />
          </div>
        </Field>

        <Field label={t("subtasks")} optional>
          <div className="task-form__subtasks">
            {subtasks.map((st) => (
              <div key={st.id} className="task-form__subtask">
                <DragIndicatorRoundedIcon className="task-form__subtask-grip" />
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={() =>
                    setSubtasks((prev) =>
                      prev.map((s) =>
                        s.id === st.id ? { ...s, done: !s.done } : s,
                      ),
                    )
                  }
                />
                <input
                  className="task-form__subtask-input"
                  value={st.title}
                  onChange={(e) =>
                    setSubtasks((prev) =>
                      prev.map((s) =>
                        s.id === st.id ? { ...s, title: e.target.value } : s,
                      ),
                    )
                  }
                />
                <IconButton
                  label={tc("delete")}
                  size="sm"
                  onClick={() =>
                    setSubtasks((prev) => prev.filter((s) => s.id !== st.id))
                  }
                >
                  <CloseRoundedIcon />
                </IconButton>
              </div>
            ))}
            <div className="task-form__subtask-add">
              <TextInput
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder={t("subtaskPlaceholder")}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<AddRoundedIcon />}
                onClick={addSubtask}
              >
                {t("addSubtask")}
              </Button>
            </div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}
