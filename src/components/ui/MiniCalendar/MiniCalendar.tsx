"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  dateKey,
  todayKey,
  startOfMonth,
  addDays,
  formatDate,
} from "@/utils/dates";
import IconButton from "@/components/ui/IconButton/IconButton";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { WEEK_ORDER, DAY_KEYS } from "@/types/common";
import "./MiniCalendar.scss";

interface MiniCalendarProps {
  /** Fecha seleccionada actualmente. */
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export default function MiniCalendar({
  value,
  onSelect,
  onClose,
}: MiniCalendarProps) {
  const td = useTranslations("days");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));

  const valueKey = dateKey(value);
  const tk = todayKey();

  // Matriz de 6 semanas (Lun→Dom), incluyendo días de meses adyacentes.
  const first = startOfMonth(viewMonth);
  const offset = (first.getDay() + 6) % 7; // 0 = lunes
  const gridStart = addDays(first, -offset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <>
      <div className="mini-cal__backdrop" onClick={onClose} />
      <div className="mini-cal" role="dialog">
        <header className="mini-cal__head">
          <IconButton
            label={tc("back")}
            size="sm"
            onClick={() => setViewMonth((m) => addDays(startOfMonth(m), -1))}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <span className="mini-cal__month">
            {formatDate(viewMonth, { month: "long", year: "numeric" }, locale)}
          </span>
          <IconButton
            label="→"
            size="sm"
            onClick={() =>
              setViewMonth((m) => startOfMonth(addDays(startOfMonth(m), 32)))
            }
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </header>

        <div className="mini-cal__weekdays">
          {WEEK_ORDER.map((d) => (
            <span key={d} className="mini-cal__weekday">
              {td(DAY_KEYS[d]).charAt(0)}
            </span>
          ))}
        </div>

        <div className="mini-cal__grid">
          {cells.map((cell) => {
            const k = dateKey(cell);
            const inMonth = cell.getMonth() === viewMonth.getMonth();
            const isSelected = k === valueKey;
            const isToday = k === tk;
            return (
              <button
                key={k}
                type="button"
                className={`mini-cal__day${
                  inMonth ? "" : " mini-cal__day--muted"
                }${isSelected ? " mini-cal__day--selected" : ""}${
                  isToday ? " mini-cal__day--today" : ""
                }`}
                onClick={() => {
                  onSelect(cell);
                  onClose();
                }}
              >
                {cell.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
