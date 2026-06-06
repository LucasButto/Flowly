"use client";
import { useTranslations } from "next-intl";
import { useTodo } from "@/contexts/TodoContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { TodoList } from "@/types/todo";
import "./ListSidebar.scss";

interface ListSidebarProps {
  selected: string;
  onSelect: (id: string) => void;
  onNewList: () => void;
  onEditList: (l: TodoList) => void;
  onDeleteList: (l: TodoList) => void;
}

export default function ListSidebar({
  selected,
  onSelect,
  onNewList,
  onEditList,
  onDeleteList,
}: ListSidebarProps) {
  const t = useTranslations("todo");
  const tc = useTranslations("common");
  const { lists, tasks } = useTodo();

  const pending = (predicate: (t: (typeof tasks)[number]) => boolean) =>
    tasks.filter((task) => task.status !== "completed" && predicate(task))
      .length;

  const favCount = pending((task) => task.favorite);

  return (
    <aside className="todo-lists">
      <nav className="todo-lists__smart">
        <button
          className={`todo-lists__item ${
            selected === "all" ? "todo-lists__item--active" : ""
          }`}
          onClick={() => onSelect("all")}
        >
          <GridViewRoundedIcon className="todo-lists__icon" />
          <span className="todo-lists__name">{t("lists")}</span>
          {lists.length > 0 && (
            <span className="todo-lists__count">{lists.length}</span>
          )}
        </button>
        <button
          className={`todo-lists__item ${
            selected === "favorites" ? "todo-lists__item--active" : ""
          }`}
          onClick={() => onSelect("favorites")}
        >
          <StarRoundedIcon className="todo-lists__icon todo-lists__icon--star" />
          <span className="todo-lists__name">{t("favorites")}</span>
          {favCount > 0 && <span className="todo-lists__count">{favCount}</span>}
        </button>
        <button
          className={`todo-lists__item ${
            selected === "history" ? "todo-lists__item--active" : ""
          }`}
          onClick={() => onSelect("history")}
        >
          <HistoryRoundedIcon className="todo-lists__icon" />
          <span className="todo-lists__name">{t("history")}</span>
        </button>
      </nav>

      <div className="todo-lists__header">
        <span>{t("lists")}</span>
        <IconButton label={t("newList")} size="sm" onClick={onNewList}>
          <AddRoundedIcon />
        </IconButton>
      </div>

      <nav className="todo-lists__custom">
        {lists.length === 0 && (
          <p className="todo-lists__empty">{t("noLists")}</p>
        )}
        {lists.map((l) => {
          const count = pending((task) => task.listId === l.id);
          return (
            <div
              key={l.id}
              className={`todo-lists__item todo-lists__item--list ${
                selected === l.id ? "todo-lists__item--active" : ""
              }`}
            >
              <button
                className="todo-lists__item-main"
                onClick={() => onSelect(l.id)}
              >
                <span
                  className="todo-lists__dot"
                  style={{ background: l.color }}
                />
                <span className="todo-lists__name">{l.name}</span>
                {count > 0 && (
                  <span className="todo-lists__count">{count}</span>
                )}
              </button>
              <div className="todo-lists__actions">
                <IconButton
                  label={tc("edit")}
                  size="sm"
                  onClick={() => onEditList(l)}
                >
                  <EditRoundedIcon />
                </IconButton>
                <IconButton
                  label={tc("delete")}
                  size="sm"
                  variant="danger"
                  onClick={() => onDeleteList(l)}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
