"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { parseDateKey, todayKey } from "@/utils/dates";
import type { FlowEvent } from "@/types/event";
import "./NextEventCard.scss";

interface NextEventCardProps {
  event: FlowEvent | null;
  date: string | null; // fecha de la ocurrencia más próxima
  href?: string;
}

export default function NextEventCard({ event, date, href }: NextEventCardProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  let name = t("noUpcoming");
  let countdown = "";

  if (event && date) {
    name = event.title;

    const d0 = parseDateKey(date);
    d0.setHours(0, 0, 0, 0);
    const t0 = new Date(now);
    t0.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((d0.getTime() - t0.getTime()) / 86400000);

    if (dayDiff <= 0) {
      if (!event.startTime) {
        countdown = tc("today");
      } else {
        const target = parseDateKey(date);
        const [h, m] = event.startTime.split(":").map(Number);
        target.setHours(h ?? 0, m ?? 0, 0, 0);
        const diffMin = Math.round((target.getTime() - now) / 60000);
        if (diffMin <= 0) {
          countdown = `${tc("today")} · ${event.startTime}`;
        } else if (diffMin < 60) {
          countdown = t("inMinutes", { count: diffMin });
        } else {
          const hh = Math.floor(diffMin / 60);
          const mm = diffMin % 60;
          countdown = mm > 0 ? `${t("in")} ${hh}h ${mm}m` : `${t("in")} ${hh}h`;
        }
      }
    } else if (dayDiff === 1) {
      countdown = event.startTime
        ? `${tc("tomorrow")} · ${event.startTime}`
        : tc("tomorrow");
    } else {
      countdown = t("inDays", { count: dayDiff });
    }
  }

  const inner = (
    <>
      <span className="next-event__icon">
        <EventRoundedIcon />
      </span>
      <div className="next-event__info">
        <span className="next-event__name">{name}</span>
        {countdown ? (
          <span className="next-event__countdown">{countdown}</span>
        ) : (
          <span className="next-event__label">{t("upcomingEvents")}</span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="next-event next-event--link">
        {inner}
      </Link>
    );
  }
  return <div className="next-event">{inner}</div>;
}

