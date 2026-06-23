"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
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
import { useToast } from "@/components/ui/Toast/ToastProvider";
import IconButton from "@/components/ui/IconButton/IconButton";
import ActionMenu from "@/components/ui/ActionMenu/ActionMenu";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import StrikethroughSRoundedIcon from "@mui/icons-material/StrikethroughSRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import { newBlock } from "@/utils/blocks";
import { caretViewportRect } from "@/utils/textareaCaret";
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
  /** Fija la barra de formato al fondo del contenedor scrolleable. */
  stickyToolbar?: boolean;
}

/** Editor de bloques controlado (notas, descripciones de tareas). */
export default function BlockEditor({
  value,
  onChange,
  stickyToolbar = false,
}: BlockEditorProps) {
  const t = useTranslations("notes");
  const toast = useToast();

  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<string | null>(null);
  const focusedId = useRef<string | null>(null);

  // Enfocar el bloque recién creado / convertido
  useEffect(() => {
    if (!pendingFocus.current) return;
    const el = inputRefs.current.get(pendingFocus.current);
    if (el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
    pendingFocus.current = null;
  }, [value]);

  // Se arrastra solo desde el asa (grip), para no pisar la selección de texto.
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
      if (focusedId.current === id) focusedId.current = null;
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

  // ─── Copiar / cortar al portapapeles ───
  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast(t("copied"), "success");
      } catch {
        // entorno sin permiso de clipboard: no rompemos el flujo
      }
    },
    [toast, t],
  );

  const copyBlock = useCallback(
    (block: NoteBlock) => void copyText(block.text),
    [copyText],
  );

  const cutBlock = useCallback(
    (block: NoteBlock) => {
      void copyText(block.text);
      removeBlock(block.id);
    },
    [copyText, removeBlock],
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
   * Botones de la toolbar: si hay un bloque enfocado, le cambia el tipo
   * (texto ↔ lista ↔ cita…) conservando el texto. Si no hay foco, agrega
   * uno nuevo. El separador siempre se inserta como bloque nuevo.
   */
  const applyType = useCallback(
    (type: NoteBlockType) => {
      const id = focusedId.current;
      const focused = id ? value.find((b) => b.id === id) : null;
      if (type !== "divider" && focused) {
        patchBlock(focused.id, {
          type,
          ...(type === "check" ? { checked: false } : {}),
        });
        pendingFocus.current = focused.id;
        return;
      }
      insertAfter(focused?.id ?? value[value.length - 1]?.id ?? null, type);
    },
    [value, patchBlock, insertAfter],
  );

  /**
   * Envuelve (o desenvuelve) la selección del bloque enfocado con un marcador
   * (`**` negrita, `_` itálica, `~~` tachado). Funciona en cualquier bloque.
   */
  const wrapMarker = useCallback(
    (marker: string) => {
      const el = document.activeElement;
      if (!(el instanceof HTMLTextAreaElement)) return;
      let blockId: string | null = null;
      inputRefs.current.forEach((node, id) => {
        if (node === el) blockId = id;
      });
      if (!blockId) return;
      const block = value.find((b) => b.id === blockId);
      if (!block) return;

      const len = marker.length;
      const s = el.selectionStart ?? 0;
      const e = el.selectionEnd ?? 0;
      const before = block.text.slice(0, s);
      const sel = block.text.slice(s, e);
      const after = block.text.slice(e);

      // Si la selección ya está envuelta, se desenvuelve
      if (before.endsWith(marker) && after.startsWith(marker)) {
        patchBlock(blockId, {
          text: before.slice(0, -len) + sel + after.slice(len),
        });
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(s - len, e - len);
        });
        return;
      }

      patchBlock(blockId, { text: `${before}${marker}${sel}${marker}${after}` });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(s + len, e + len);
      });
    },
    [value, patchBlock],
  );

  // ─── Burbuja de formato sobre la selección (estilo WhatsApp) ───
  const [bubble, setBubble] = useState<{
    x: number;
    y: number;
    placement: "top" | "bottom";
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateBubble = useCallback(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) {
      setBubble(null);
      return;
    }
    // ¿Es un textarea de un bloque?
    let isBlock = false;
    inputRefs.current.forEach((node) => {
      if (node === el) isBlock = true;
    });
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    if (!isBlock || s === e) {
      setBubble(null);
      return;
    }
    const start = caretViewportRect(el, s);
    const end = caretViewportRect(el, e);
    const sameLine = Math.abs(start.top - end.top) < 2;
    const centerX = sameLine ? (start.left + end.left) / 2 : start.left;
    const x = Math.min(Math.max(centerX, 96), window.innerWidth - 96);
    const above = start.top > 70;
    setBubble({
      x,
      y: above ? start.top - 8 : end.top + end.height + 8,
      placement: above ? "top" : "bottom",
    });
  }, []);

  const scheduleBubble = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateBubble);
  }, [updateBubble]);

  useEffect(() => {
    document.addEventListener("selectionchange", scheduleBubble);
    window.addEventListener("scroll", scheduleBubble, true);
    window.addEventListener("resize", scheduleBubble);
    return () => {
      document.removeEventListener("selectionchange", scheduleBubble);
      window.removeEventListener("scroll", scheduleBubble, true);
      window.removeEventListener("resize", scheduleBubble);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleBubble]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: NoteBlock) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapMarker("**");
        return;
      }
      if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapMarker("_");
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
    [insertAfter, removeBlock, patchBlock, wrapMarker],
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
                onFocusBlock={(id) => (focusedId.current = id)}
                onTextChange={onTextChange}
                onKeyDown={onKeyDown}
                onToggleCheck={(b) => patchBlock(b.id, { checked: !b.checked })}
                onRemove={removeBlock}
                onCopy={copyBlock}
                onCut={cutBlock}
                placeholder={t("blockPlaceholder")}
                removeLabel={t("removeBlock")}
                copyLabel={t("copyBlock")}
                cutLabel={t("cutBlock")}
                moreLabel={t("moreActions")}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        className="block-editor__add"
        onClick={() =>
          insertAfter(value[value.length - 1]?.id ?? null, "text")
        }
      >
        <AddRoundedIcon />
        {t("addText")}
      </button>

      <div
        className={`block-editor__toolbar ${
          stickyToolbar ? "block-editor__toolbar--sticky" : ""
        }`}
      >
        <IconButton
          label={`${t("bold")} (Ctrl+B)`}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapMarker("**")}
        >
          <FormatBoldRoundedIcon />
        </IconButton>
        <IconButton
          label={`${t("italic")} (Ctrl+I)`}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapMarker("_")}
        >
          <FormatItalicRoundedIcon />
        </IconButton>
        <IconButton
          label={t("strike")}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapMarker("~~")}
        >
          <StrikethroughSRoundedIcon />
        </IconButton>
        <span className="block-editor__toolbar-sep" />
        <span className="block-editor__toolbar-label">{t("addBlock")}</span>
        {BLOCK_TYPES.map(({ type, icon }) => (
          <IconButton
            key={type}
            label={t(`block_${type}`)}
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyType(type)}
          >
            {icon}
          </IconButton>
        ))}
      </div>

      {/* Burbuja de formato sobre el texto seleccionado */}
      {bubble &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="block-editor__bubble"
            style={{
              left: bubble.x,
              top: bubble.y,
              transform:
                bubble.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
            }}
            // No robar el foco/selección del textarea al interactuar
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="block-editor__bubble-btn"
              onClick={() => wrapMarker("**")}
              aria-label={t("bold")}
              title={t("bold")}
            >
              <FormatBoldRoundedIcon />
            </button>
            <button
              type="button"
              className="block-editor__bubble-btn"
              onClick={() => wrapMarker("_")}
              aria-label={t("italic")}
              title={t("italic")}
            >
              <FormatItalicRoundedIcon />
            </button>
            <button
              type="button"
              className="block-editor__bubble-btn"
              onClick={() => wrapMarker("~~")}
              aria-label={t("strike")}
              title={t("strike")}
            >
              <StrikethroughSRoundedIcon />
            </button>
            <button
              type="button"
              className="block-editor__bubble-btn"
              onClick={() => wrapMarker("`")}
              aria-label={t("code")}
              title={t("code")}
            >
              <CodeRoundedIcon />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Fila de bloque (sortable) ───────────────────────────────────────────────
interface BlockRowProps {
  block: NoteBlock;
  numberIdx: number;
  inputRefs: React.RefObject<Map<string, HTMLTextAreaElement>>;
  onFocusBlock: (id: string) => void;
  onTextChange: (block: NoteBlock, value: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    block: NoteBlock,
  ) => void;
  onToggleCheck: (block: NoteBlock) => void;
  onRemove: (id: string) => void;
  onCopy: (block: NoteBlock) => void;
  onCut: (block: NoteBlock) => void;
  placeholder: string;
  removeLabel: string;
  copyLabel: string;
  cutLabel: string;
  moreLabel: string;
}

function BlockRow({
  block,
  numberIdx,
  inputRefs,
  onFocusBlock,
  onTextChange,
  onKeyDown,
  onToggleCheck,
  onRemove,
  onCopy,
  onCut,
  placeholder,
  removeLabel,
  copyLabel,
  cutLabel,
  moreLabel,
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

  const isDivider = block.type === "divider";

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

      {isDivider ? (
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
          onFocus={() => onFocusBlock(block.id)}
          onChange={(e) => {
            onTextChange(block, e.target.value);
            autoGrow(e.target);
          }}
          onKeyDown={(e) => onKeyDown(e, block)}
        />
      )}

      <div className="block-editor__actions">
        <ActionMenu
          label={moreLabel}
          className="block-editor__menu-btn"
          items={[
            ...(isDivider
              ? []
              : [
                  {
                    label: copyLabel,
                    icon: <ContentCopyRoundedIcon />,
                    onClick: () => onCopy(block),
                  },
                  {
                    label: cutLabel,
                    icon: <ContentCutRoundedIcon />,
                    onClick: () => onCut(block),
                  },
                ]),
            {
              label: removeLabel,
              icon: <DeleteOutlineRoundedIcon />,
              onClick: () => onRemove(block.id),
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  );
}
