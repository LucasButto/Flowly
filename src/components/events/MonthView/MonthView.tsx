"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { eventsOnDate } from "@/utils/events";
import { startOfWeek, startOfMonth, addDays, dateKey, todayKey } from "@/utils/dates";
import type { FlowEvent } from "@/types/event";
import "./MonthView.scss";

interface MonthViewProps {
  monthDate: Date;
  events: FlowEvent[];
  onSelectDate: (key: string) => void;
  onSelectEvent: (event: FlowEvent, date: string) => void;
}

const MAX_CHIPS = 3;

export default function MonthView({
  monthDate,
  events,
  onSelectDate,
  onSelectEvent,
}: MonthViewProps) {
  const td = useTranslations("days");
  const te = useTranslations("events");

  const cells = useMemo(() => {
    const first = startOfMonth(monthDate);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [monthDate]);

  const weekdayLabels = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const month = monthDate.getMonth();
  const today = todayKey();

  return (
    <div className="month-view">
      <div className="month-view__weekdays">
        {weekdayLabels.map((d) => (
          <span key={d}>{td(d)}</span>
        ))}
      </div>
      <div className="month-view__grid">
        {cells.map((date) => {
          const key = dateKey(date);
          const dayEvents = eventsOnDate(events, date).sort((a, b) =>
            (a.startTime ?? "").localeCompare(b.startTime ?? ""),
          );
          const outside = date.getMonth() !== month;
          return (
            <div
              key={key}
              className={`month-view__cell ${outside ? "month-view__cell--outside" : ""} ${
                key === today ? "month-view__cell--today" : ""
              }`}
              onClick={() => onSelectDate(key)}
            >
              <span className="month-view__daynum">{date.getDate()}</span>
              <div className="month-view__events">
                {dayEvents.slice(0, MAX_CHIPS).map((ev) => (
                  <button
                    key={ev.id}
                    className="month-view__chip"
                    style={{ "--ev": ev.color } as React.CSSProperties}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev, key);
                    }}
                    title={ev.title}
                  >
                    {ev.startTime && (
                      <span className="month-view__chip-time">
                        {ev.startTime}
                      </span>
                    )}
                    <span className="month-view__chip-title">{ev.title}</span>
                  </button>
                ))}
                {dayEvents.length > MAX_CHIPS && (
                  <span className="month-view__more">
                    {te("moreEvents", { count: dayEvents.length - MAX_CHIPS })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
