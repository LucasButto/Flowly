"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTodo } from "@/contexts/TodoContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import BlockContent from "@/components/blocks/BlockContent/BlockContent";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CheckListRoundedIcon from "@mui/icons-material/ChecklistRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import { formatRelativeDay, todayKey } from "@/utils/dates";
import { textToBlocks } from "@/utils/blocks";
import type { Task } from "@/types/todo";
import type { NoteBlock } from "@/types/blocks";
import "./TaskItem.scss";

interface TaskItemProps {
  task: Task;
  sortable?: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}

export default function TaskItem({
  task,
  sortable = false,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const t = useTranslations("todo");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const locale = useLocale();
  const { toggleComplete, toggleFavorite, editTask } = useTodo();
  // Con descripción, el detalle arranca abierto (limitado en altura)
  const [expanded, setExpanded] = useState(
    () => Boolean(task.descriptionBlocks?.length) || Boolean(task.description),
  );
  const [descFull, setDescFull] = useState(false);
  const [descOverflow, setDescOverflow] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const completed = task.status === "completed";
  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const totalSubs = task.subtasks.length;
  const overdue =
    !completed && task.dueDate && task.dueDate < todayKey() ? true : false;

  // Bloques de descripción (tareas viejas: texto plano → bloques al vuelo)
  const descBlocks: NoteBlock[] = useMemo(
    () =>
      task.descriptionBlocks?.length
        ? task.descriptionBlocks
        : textToBlocks(task.description),
    [task.descriptionBlocks, task.description],
  );
  const hasDesc = descBlocks.length > 0;
  const expandable = totalSubs > 0 || hasDesc;

  // ¿La descripción desborda la altura máxima? → mostrar "…" y "Ver más"
  useEffect(() => {
    if (!expanded || !hasDesc) return;
    const el = descRef.current;
    if (el) setDescOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, hasDesc, descFull, descBlocks]);

  const toggleSub = (subId: string) => {
    editTask(task.id, {
      subtasks: task.subtasks.map((s) =>
        s.id === subId ? { ...s, done: !s.done } : s,
      ),
    });
  };

  // Marcar checklists de la descripción (solo tareas con bloques persistidos)
  const toggleDescCheck = (block: NoteBlock) => {
    if (!task.descriptionBlocks?.length) return;
    void editTask(task.id, {
      descriptionBlocks: task.descriptionBlocks.map((b) =>
        b.id === block.id ? { ...b, checked: !b.checked } : b,
      ),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item ${completed ? "task-item--done" : ""}`}
    >
      <div className="task-item__main">
        {sortable && (
          <button
            className="task-item__grip"
            {...attributes}
            {...listeners}
            aria-label="Reordenar"
          >
            <DragIndicatorRoundedIcon />
          </button>
        )}

        <button
          className={`task-item__check ${
            completed ? "task-item__check--on" : ""
          }`}
          onClick={() => toggleComplete(task)}
          aria-label={completed ? ts("pending") : ts("completed")}
        />

        <button className="task-item__content" onClick={() => onEdit(task)}>
          <span className="task-item__title">{task.title}</span>
          <div className="task-item__meta">
            {task.dueDate && (
              <span
                className={`task-item__due ${
                  overdue ? "task-item__due--over" : ""
                }`}
              >
                <EventRoundedIcon />
                {formatRelativeDay(
                  task.dueDate,
                  {
                    today: tc("today"),
                    yesterday: tc("yesterday"),
                    tomorrow: tc("tomorrow"),
                  },
                  locale,
                )}
              </span>
            )}
            {totalSubs > 0 && (
              <span className="task-item__subs">
                <CheckListRoundedIcon />
                {doneSubs}/{totalSubs}
              </span>
            )}
            {hasDesc && (
              <span className="task-item__subs">
                <NotesRoundedIcon />
              </span>
            )}
            {task.tags.map((tag) => (
              <span key={tag} className="task-item__tag">
                #{tag}
              </span>
            ))}
          </div>
        </button>

        <div className="task-item__tools">
          {expandable && (
            <IconButton
              label={t("expand")}
              size="sm"
              onClick={() => setExpanded((e) => !e)}
              className={`task-item__expand ${
                expanded ? "task-item__expand--open" : ""
              }`}
            >
              <ExpandMoreRoundedIcon />
            </IconButton>
          )}
          <IconButton
            label={task.favorite ? t("unfavorite") : t("favorite")}
            size="sm"
            onClick={() => toggleFavorite(task)}
            className={task.favorite ? "task-item__fav--on" : ""}
          >
            {task.favorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
          </IconButton>
          <IconButton label={tc("edit")} size="sm" onClick={() => onEdit(task)}>
            <EditRoundedIcon />
          </IconButton>
          <IconButton
            label={tc("delete")}
            size="sm"
            variant="danger"
            onClick={() => onDelete(task)}
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </div>
      </div>

      {expanded && hasDesc && (
        <div className="task-item__desc">
          <div
            ref={descRef}
            className={`task-item__desc-clamp ${
              descFull ? "task-item__desc-clamp--open" : ""
            }`}
          >
            <BlockContent
              blocks={descBlocks}
              onToggleCheck={
                task.descriptionBlocks?.length ? toggleDescCheck : undefined
              }
            />
          </div>
          {(descOverflow || descFull) && (
            <button
              type="button"
              className="task-item__desc-more"
              onClick={() => setDescFull((f) => !f)}
            >
              {descFull ? t("seeLess") : t("seeMore")}
            </button>
          )}
        </div>
      )}

      {expanded && totalSubs > 0 && (
        <ul className="task-item__subtasks">
          {task.subtasks.map((s) => (
            <li key={s.id} className="task-item__subtask">
              <button
                className={`task-item__check task-item__check--sm ${
                  s.done ? "task-item__check--on" : ""
                }`}
                onClick={() => toggleSub(s.id)}
                aria-label={s.title}
              />
              <span className={s.done ? "task-item__subtask--done" : ""}>
                {s.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
