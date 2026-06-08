"use client";
import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { occurrencesInRange } from "@/utils/events";
import {
  startOfWeek,
  startOfMonth,
  addDays,
  dateKey,
  todayKey,
  formatDate,
} from "@/utils/dates";
import { WEEK_ORDER, DAY_KEYS } from "@/types/common";
import type { FlowEvent } from "@/types/event";
import "./YearView.scss";

interface YearViewProps {
  monthDate: Date; // cualquier fecha del año a mostrar
  events: FlowEvent[];
  onSelectDate: (key: string) => void;
  onSelectMonth: (date: Date) => void;
}

export default function YearView({
  monthDate,
  events,
  onSelectDate,
  onSelectMonth,
}: YearViewProps) {
  const td = useTranslations("days");
  const locale = useLocale();
  const year = monthDate.getFullYear();
  const today = todayKey();

  const eventDays = useMemo(() => {
    const set = new Set<string>();
    for (const { date } of occurrencesInRange(
      events,
      new Date(year, 0, 1),
      new Date(year, 11, 31),
    )) {
      set.add(date);
    }
    return set;
  }, [events, year]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => {
        const gridStart = startOfWeek(startOfMonth(new Date(year, m, 1)));
        return {
          m,
          cells: Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
        };
      }),
    [year],
  );

  const weekdayInitials = WEEK_ORDER.map((d) => td(DAY_KEYS[d]).charAt(0));

  return (
    <div className="year-view">
      {months.map(({ m, cells }) => (
        <div key={m} className="year-view__month">
          <button
            className="year-view__month-name"
            onClick={() => onSelectMonth(new Date(year, m, 1))}
          >
            {formatDate(new Date(year, m, 1), { month: "long" }, locale)}
          </button>

          <div className="year-view__weekdays">
            {weekdayInitials.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>

          <div className="year-view__grid">
            {cells.map((d) => {
              const key = dateKey(d);
              const outside = d.getMonth() !== m;
              const has = !outside && eventDays.has(key);
              return (
                <button
                  key={key}
                  className={`year-view__day ${
                    outside ? "year-view__day--outside" : ""
                  } ${key === today ? "year-view__day--today" : ""} ${
                    has ? "year-view__day--has" : ""
                  }`}
                  onClick={() => !outside && onSelectDate(key)}
                  disabled={outside}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
