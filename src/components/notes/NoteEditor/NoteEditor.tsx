"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useNotes } from "@/contexts/NotesContext";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import ColorPicker from "@/components/ui/ColorPicker/ColorPicker";
import IconPicker from "@/components/ui/IconPicker/IconPicker";
import PriorityPicker from "@/components/ui/PriorityPicker/PriorityPicker";
import BlockEditor from "@/components/blocks/BlockEditor/BlockEditor";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { newBlock, cleanBlocks } from "@/utils/blocks";
import { DEFAULT_COLOR } from "@/utils/colors";
import type { Note, NoteBlock } from "@/types/note";
import type { Priority } from "@/types/common";
import "./NoteEditor.scss";

interface NoteEditorProps {
  open: boolean;
  note: Note | null;
  onClose: () => void;
}

export default function NoteEditor({ open, note, onClose }: NoteEditorProps) {
  const t = useTranslations("notes");
  const tc = useTranslations("common");
  const { addNote, editNote } = useNotes();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [icon, setIcon] = useState<string>("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [pinned, setPinned] = useState(false);
  const [blocks, setBlocks] = useState<NoteBlock[]>([newBlock()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setColor(note?.color ?? DEFAULT_COLOR);
    setIcon(note?.icon ?? "");
    setPriority(note?.priority ?? "");
    setPinned(note?.pinned ?? false);
    setBlocks(
      note?.blocks?.length ? note.blocks.map((b) => ({ ...b })) : [newBlock()],
    );
    setSaving(false);
  }, [open, note]);

  const handleSave = async () => {
    const blocksClean = cleanBlocks(blocks);
    const cleanTitle = title.trim();
    // Nota completamente vacía → no guardar nada
    if (!note && !cleanTitle && blocksClean.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      if (note) {
        await editNote(note.id, {
          title: cleanTitle,
          color,
          icon,
          priority,
          pinned,
          blocks: blocksClean,
        });
      } else {
        await addNote({
          title: cleanTitle,
          color,
          icon,
          priority,
          pinned,
          blocks: blocksClean,
        });
      }
      onClose();
    } catch {
      // el contexto ya mostró el toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="note-editor__heading">
          {note ? t("editNote") : t("newNote")}
          <IconButton
            label={pinned ? t("unpin") : t("pin")}
            size="sm"
            onClick={() => setPinned((p) => !p)}
            className={`note-editor__pin ${
              pinned ? "note-editor__pin--on" : ""
            }`}
          >
            {pinned ? <PushPinRoundedIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
        </span>
      }
      size="lg"
      footer={
        <div className="note-editor__footer">
          <div className="note-editor__footer-left">
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="note-editor__footer-actions">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {tc("cancel")}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {tc("save")}
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="note-editor"
        style={{ "--accent": color } as React.CSSProperties}
      >
        <input
          className="note-editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={140}
        />

        <div className="note-editor__row">
          <div className="note-editor__icons">
            <span className="note-editor__icons-label">{tc("icon")}</span>
            <IconPicker value={icon} onChange={setIcon} accent={color} />
          </div>

          <div className="note-editor__icons">
            <span className="note-editor__icons-label">{tc("priority")}</span>
            <PriorityPicker value={priority} onChange={setPriority} />
          </div>
        </div>

        <BlockEditor value={blocks} onChange={setBlocks} stickyToolbar />
      </div>
    </Modal>
  );
}
