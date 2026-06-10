"use client";
import { useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { eventsOnDate, layoutTimedEvents } from "@/utils/events";
import { dateKey, todayKey } from "@/utils/dates";
import type { FlowEvent } from "@/types/event";
import "./TimeGrid.scss";

interface TimeGridProps {
  days: Date[];
  events: FlowEvent[];
  onSelectEvent: (event: FlowEvent, date: string) => void;
  onSelectDate: (key: string) => void;
}

const HOUR_HEIGHT = 50;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TOTAL = 24 * HOUR_HEIGHT;

export default function TimeGrid({
  days,
  events,
  onSelectEvent,
  onSelectDate,
}: TimeGridProps) {
  const td = useTranslations("days");
  const te = useTranslations("events");
  const bodyRef = useRef<HTMLDivElement>(null);

  const today = todayKey();
  const weekdayShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  // Posicionar scroll inicial cerca de las 7:00
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

  const perDay = useMemo(
    () =>
      days.map((d) => {
        const dayEvents = eventsOnDate(events, d);
        return {
          date: d,
          key: dateKey(d),
          allDay: dayEvents.filter((e) => !e.startTime),
          timed: layoutTimedEvents(dayEvents),
        };
      }),
    [days, events],
  );

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div
      className={`time-grid ${days.length > 1 ? "time-grid--multi" : ""}`}
      style={{ "--day-cols": days.length } as React.CSSProperties}
    >
      {/* Header con días */}
      <div className="time-grid__header">
        <div className="time-grid__gutter-head" />
        {perDay.map(({ date, key }) => (
          <button
            key={key}
            className={`time-grid__day-head ${
              key === today ? "time-grid__day-head--today" : ""
            }`}
            onClick={() => onSelectDate(key)}
          >
            <span className="time-grid__dow">{td(weekdayShort[date.getDay()]!)}</span>
            <span className="time-grid__dnum">{date.getDate()}</span>
          </button>
        ))}
      </div>

      {/* Franja de todo el día */}
      {perDay.some((d) => d.allDay.length > 0) && (
        <div className="time-grid__allday">
          <div className="time-grid__gutter-head time-grid__allday-label">
            {te("allDay")}
          </div>
          {perDay.map((d) => (
            <div key={d.key} className="time-grid__allday-col">
              {d.allDay.map((ev) => (
                <button
                  key={ev.id}
                  className="time-grid__allday-chip"
                  style={{ "--ev": ev.color } as React.CSSProperties}
                  onClick={() => onSelectEvent(ev, d.key)}
                >
                  {ev.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Cuerpo con horas */}
      <div className="time-grid__body" ref={bodyRef}>
        <div className="time-grid__scroll" style={{ height: TOTAL }}>
          <div className="time-grid__gutter">
            {HOURS.map((h) => (
              <div
                key={h}
                className="time-grid__hour-label"
                style={{ height: HOUR_HEIGHT }}
              >
                {h > 0 && <span>{String(h).padStart(2, "0")}:00</span>}
              </div>
            ))}
          </div>

          {perDay.map(({ key, timed, date }) => (
            <div
              key={key}
              className="time-grid__col"
              onClick={() => onSelectDate(key)}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="time-grid__hour-cell"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {dateKey(date) === today && (
                <div
                  className="time-grid__now"
                  style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                />
              )}

              {timed.map((pos) => {
                const top = (pos.startMin / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  18,
                  ((pos.endMin - pos.startMin) / 60) * HOUR_HEIGHT - 2,
                );
                const width = 100 / pos.cols;
                return (
                  <button
                    key={pos.event.id}
                    className="time-grid__event"
                    style={
                      {
                        top,
                        height,
                        left: `calc(${pos.col * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        "--ev": pos.event.color,
                      } as React.CSSProperties
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(pos.event, key);
                    }}
                  >
                    <span className="time-grid__event-title">
                      {pos.event.title}
                    </span>
                    {pos.event.startTime && (
                      <span className="time-grid__event-time">
                        {pos.event.startTime}
                        {pos.event.endTime ? `–${pos.event.endTime}` : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
