"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTodo } from "@/contexts/TodoContext";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";
import Field from "@/components/ui/Field/Field";
import TextInput from "@/components/ui/Field/TextInput";
import ColorPicker from "@/components/ui/ColorPicker/ColorPicker";
import { DEFAULT_COLOR } from "@/utils/colors";
import type { TodoList } from "@/types/todo";

interface ListFormProps {
  open: boolean;
  list?: TodoList | null;
  onClose: () => void;
}

export default function ListForm({ open, list, onClose }: ListFormProps) {
  const t = useTranslations("todo");
  const tc = useTranslations("common");
  const { addList, editList } = useTodo();

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(list?.name ?? "");
    setColor(list?.color ?? DEFAULT_COLOR);
  }, [open, list]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t("validation.listNameRequired"));
      return;
    }
    setSaving(true);
    try {
      if (list) await editList(list.id, { name: name.trim(), color });
      else await addList({ name: name.trim(), color });
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
      title={list ? t("editList") : t("newList")}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {list ? tc("saveChanges") : tc("create")}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <Field label={t("listName")} error={error ?? undefined}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("listNamePlaceholder")}
            autoFocus
          />
        </Field>
        <Field label={tc("color")}>
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </div>
    </Modal>
  );
}
