"use client";
import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import IconButton from "@/components/ui/IconButton/IconButton";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import { newBlock } from "@/utils/blocks";
import type { NoteBlock, NoteBlockType } from "@/types/blocks";
import "./BlockEditor.scss";

const BLOCK_TYPES: { type: NoteBlockType; icon: React.ReactNode }[] = [
  { type: "text", icon: <TextFieldsRoundedIcon /> },
  { type: "h1", icon: <TitleRoundedIcon /> },
  { type: "h2", icon: <TitleRoundedIcon style={{ fontSize: "1rem" }} /> },
  { type: "bullet", icon: <FormatListBulletedRoundedIcon /> },
  { type: "number", icon: <FormatListNumberedRoundedIcon /> },
  { type: "check", icon: <ChecklistRoundedIcon /> },
  { type: "quote", icon: <FormatQuoteRoundedIcon /> },
  { type: "divider", icon: <HorizontalRuleRoundedIcon /> },
];

/** Atajos tipo markdown al escribir al inicio de un bloque de texto. */
function matchShortcut(
  text: string,
): { type: NoteBlockType; text: string } | null {
  if (text.startsWith("## ")) return { type: "h2", text: text.slice(3) };
  if (text.startsWith("# ")) return { type: "h1", text: text.slice(2) };
  if (text.startsWith("- ") || text.startsWith("* "))
    return { type: "bullet", text: text.slice(2) };
  if (/^1[.)] /.test(text)) return { type: "number", text: text.slice(3) };
  if (text.startsWith("[] ")) return { type: "check", text: text.slice(3) };
  if (text.startsWith("> ")) return { type: "quote", text: text.slice(2) };
  return null;
}

interface BlockEditorProps {
  value: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
}

/** Editor de bloques controlado (notas, descripciones de tareas). */
export default function BlockEditor({ value, onChange }: BlockEditorProps) {
  const t = useTranslations("notes");

  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<string | null>(null);

  // Enfocar el bloque recién creado
  useEffect(() => {
    if (!pendingFocus.current) return;
    const el = inputRefs.current.get(pendingFocus.current);
    if (el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
    pendingFocus.current = null;
  }, [value]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const patchBlock = useCallback(
    (id: string, patch: Partial<NoteBlock>) => {
      onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [value, onChange],
  );

  const insertAfter = useCallback(
    (id: string | null, type: NoteBlockType) => {
      const block = newBlock(type);
      pendingFocus.current = type === "divider" ? null : block.id;
      if (id === null) {
        onChange([...value, block]);
        return;
      }
      const i = value.findIndex((b) => b.id === id);
      onChange([...value.slice(0, i + 1), block, ...value.slice(i + 1)]);
    },
    [value, onChange],
  );

  const removeBlock = useCallback(
    (id: string) => {
      if (value.length <= 1) {
        onChange([newBlock()]);
        return;
      }
      const i = value.findIndex((b) => b.id === id);
      const before = value[i - 1];
      if (before && before.type !== "divider") pendingFocus.current = before.id;
      onChange(value.filter((b) => b.id !== id));
    },
    [value, onChange],
  );

  const onTextChange = useCallback(
    (block: NoteBlock, text: string) => {
      if (block.type === "text") {
        const shortcut = matchShortcut(text);
        if (shortcut) {
          patchBlock(block.id, {
            type: shortcut.type,
            text: shortcut.text,
            ...(shortcut.type === "check" ? { checked: false } : {}),
          });
          return;
        }
      }
      patchBlock(block.id, { text });
    },
    [patchBlock],
  );

  /**
   * Envuelve (o desenvuelve) la selección del bloque enfocado en **negrita**.
   * Funciona en cualquier tipo de bloque con texto.
   */
  const wrapBold = useCallback(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) return;
    let blockId: string | null = null;
    inputRefs.current.forEach((node, id) => {
      if (node === el) blockId = id;
    });
    if (!blockId) return;
    const block = value.find((b) => b.id === blockId);
    if (!block) return;

    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const before = block.text.slice(0, s);
    const sel = block.text.slice(s, e);
    const after = block.text.slice(e);

    // Si ya está en negrita, la quita
    if (before.endsWith("**") && after.startsWith("**")) {
      patchBlock(blockId, {
        text: before.slice(0, -2) + sel + after.slice(2),
      });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(s - 2, e - 2);
      });
      return;
    }

    patchBlock(blockId, { text: `${before}**${sel}**${after}` });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 2, e + 2);
    });
  }, [value, patchBlock]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: NoteBlock) => {
      if (e.key.toLowerCase() === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        wrapBold();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // En listas vacías, Enter sale de la lista (vuelve a texto)
        if (!block.text && ["bullet", "number", "check"].includes(block.type)) {
          patchBlock(block.id, { type: "text" });
          return;
        }
        const keepType = ["bullet", "number", "check"].includes(block.type)
          ? block.type
          : "text";
        insertAfter(block.id, keepType);
      } else if (e.key === "Backspace" && !block.text) {
        e.preventDefault();
        removeBlock(block.id);
      }
    },
    [insertAfter, removeBlock, patchBlock, wrapBold],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIndex = value.findIndex((b) => b.id === active.id);
      const newIndex = value.findIndex((b) => b.id === over.id);
      onChange(arrayMove(value, oldIndex, newIndex));
    },
    [value, onChange],
  );

  // Índices de listas numeradas (consecutivos)
  const numberIndex = (id: string) => {
    let n = 0;
    for (const b of value) {
      n = b.type === "number" ? n + 1 : 0;
      if (b.id === id) return n;
    }
    return 1;
  };

  return (
    <div className="block-editor">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={value.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="block-editor__blocks">
            {value.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                numberIdx={block.type === "number" ? numberIndex(block.id) : 0}
                inputRefs={inputRefs}
                onTextChange={onTextChange}
                onKeyDown={onKeyDown}
                onToggleCheck={(b) => patchBlock(b.id, { checked: !b.checked })}
                onRemove={removeBlock}
                placeholder={t("blockPlaceholder")}
                removeLabel={t("removeBlock")}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="block-editor__toolbar">
        <IconButton
          label={`${t("bold")} (Ctrl+B)`}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={wrapBold}
        >
          <FormatBoldRoundedIcon />
        </IconButton>
        <span className="block-editor__toolbar-sep" />
        <span className="block-editor__toolbar-label">{t("addBlock")}</span>
        {BLOCK_TYPES.map(({ type, icon }) => (
          <IconButton
            key={type}
            label={t(`block_${type}`)}
            size="sm"
            onClick={() =>
              insertAfter(value[value.length - 1]?.id ?? null, type)
            }
          >
            {icon}
          </IconButton>
        ))}
      </div>
    </div>
  );
}

// ─── Fila de bloque (sortable) ───────────────────────────────────────────────
interface BlockRowProps {
  block: NoteBlock;
  numberIdx: number;
  inputRefs: React.RefObject<Map<string, HTMLTextAreaElement>>;
  onTextChange: (block: NoteBlock, value: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    block: NoteBlock,
  ) => void;
  onToggleCheck: (block: NoteBlock) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  removeLabel: string;
}

function BlockRow({
  block,
  numberIdx,
  inputRefs,
  onTextChange,
  onKeyDown,
  onToggleCheck,
  onRemove,
  placeholder,
  removeLabel,
}: BlockRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-editor__row block-editor__row--${block.type}`}
    >
      <button
        type="button"
        className="block-editor__grip"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
        tabIndex={-1}
      >
        <DragIndicatorRoundedIcon />
      </button>

      {block.type === "bullet" && <span className="block-editor__bullet" />}
      {block.type === "number" && (
        <span className="block-editor__num">{numberIdx}.</span>
      )}
      {block.type === "check" && (
        <button
          type="button"
          className={`block-editor__check ${
            block.checked ? "block-editor__check--on" : ""
          }`}
          onClick={() => onToggleCheck(block)}
          aria-label={block.text}
        />
      )}
      {block.type === "quote" && <span className="block-editor__quote-bar" />}

      {block.type === "divider" ? (
        <hr className="block-editor__divider" />
      ) : (
        <textarea
          ref={(el) => {
            if (el) {
              inputRefs.current.set(block.id, el);
              autoGrow(el);
            } else {
              inputRefs.current.delete(block.id);
            }
          }}
          className={`block-editor__input ${
            block.type === "check" && block.checked
              ? "block-editor__input--done"
              : ""
          }`}
          value={block.text}
          rows={1}
          placeholder={placeholder}
          onChange={(e) => {
            onTextChange(block, e.target.value);
            autoGrow(e.target);
          }}
          onKeyDown={(e) => onKeyDown(e, block)}
        />
      )}

      <button
        type="button"
        className="block-editor__remove"
        onClick={() => onRemove(block.id)}
        aria-label={removeLabel}
        title={removeLabel}
        tabIndex={-1}
      >
        <DeleteOutlineRoundedIcon />
      </button>
    </div>
  );
}
