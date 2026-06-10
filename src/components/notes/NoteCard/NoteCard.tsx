"use client";
import { useTranslations, useLocale } from "next-intl";
import { useNotes } from "@/contexts/NotesContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import BlockContent from "@/components/blocks/BlockContent/BlockContent";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { formatDate } from "@/utils/dates";
import type { Note, NoteBlock } from "@/types/note";
import "./NoteCard.scss";

const MAX_PREVIEW_BLOCKS = 8;

interface NoteCardProps {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (n: Note) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const t = useTranslations("notes");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { editNote, togglePin, duplicateNote } = useNotes();

  const visible = note.blocks.slice(0, MAX_PREVIEW_BLOCKS);
  const hidden = note.blocks.length - visible.length;

  const checks = note.blocks.filter((b) => b.type === "check");
  const checksDone = checks.filter((b) => b.checked).length;

  const toggleCheck = (block: NoteBlock) => {
    void editNote(note.id, {
      blocks: note.blocks.map((b) =>
        b.id === block.id ? { ...b, checked: !b.checked } : b,
      ),
    });
  };

  return (
    <article
      className="note-card"
      style={{ "--accent": note.color } as React.CSSProperties}
      onClick={() => onEdit(note)}
    >
      <span className="note-card__bar" />

      {/* Cabecera: fecha de creación a la izquierda, acciones a la derecha */}
      <header className="note-card__head">
        <span className="note-card__date">
          {formatDate(
            new Date(note.createdAt),
            { day: "numeric", month: "short" },
            locale,
          )}
        </span>
        <div className="note-card__tools" onClick={(e) => e.stopPropagation()}>
          <IconButton
            label={note.pinned ? t("unpin") : t("pin")}
            size="sm"
            onClick={() => togglePin(note)}
            className={note.pinned ? "note-card__pin--on" : ""}
          >
            {note.pinned ? <PushPinRoundedIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
          <IconButton
            label={t("duplicate")}
            size="sm"
            onClick={() => duplicateNote(note)}
          >
            <ContentCopyRoundedIcon />
          </IconButton>
          <IconButton
            label={tc("delete")}
            size="sm"
            variant="danger"
            onClick={() => onDelete(note)}
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </div>
      </header>

      <h3 className="note-card__title">{note.title || t("untitled")}</h3>

      {visible.length > 0 && (
        <div className="note-card__body">
          <BlockContent blocks={visible} onToggleCheck={toggleCheck} />
          {hidden > 0 && (
            <span className="note-card__more">
              +{hidden} {t("moreBlocks")}
            </span>
          )}
        </div>
      )}

      {checks.length > 0 && (
        <footer className="note-card__foot">
          <span
            className={`note-card__progress ${
              checksDone === checks.length ? "note-card__progress--done" : ""
            }`}
          >
            {checksDone}/{checks.length}
          </span>
        </footer>
      )}
    </article>
  );
}
