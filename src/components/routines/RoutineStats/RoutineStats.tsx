"use client";
import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRoutines } from "@/contexts/RoutinesContext";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import ProgressRing from "@/components/ui/ProgressRing/ProgressRing";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { dayAggregate, rangeCompletion } from "@/utils/routineStats";
import { weekDays, daysInMonth, dateKey } from "@/utils/dates";
import "./RoutineStats.scss";

type Range = "daily" | "weekly" | "monthly" | "yearly";

interface Point {
  label: string;
  value: number;
  muted?: boolean;
}

const W = 640;
const H = 190;
const PAD_X = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 12;

function LineChart({ points }: { points: Point[] }) {
  const gid = useId().replace(/:/g, "");
  const n = points.length;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const xFor = (i: number) =>
    PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (v: number) => PAD_TOP + innerH - (v / 100) * innerH;

  // Recortar la línea hasta el último punto "realizado" (no futuro)
  let realized = points.length;
  while (realized > 0 && points[realized - 1]?.muted) realized--;

  const coords = Array.from({ length: realized }, (_, i) => [
    xFor(i),
    yFor(points[i]!.value),
  ] as const);
  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath =
    realized > 1
      ? `${linePath} L${coords[realized - 1]![0]},${yFor(0)} L${coords[0]![0]},${yFor(0)} Z`
      : "";

  return (
    <div className="rstats-chart">
      <svg
        className="rstats-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand-rgb) / 0.35)" />
            <stop offset="100%" stopColor="rgb(var(--brand-rgb) / 0)" />
          </linearGradient>
        </defs>

        {[0, 50, 100].map((v) => (
          <line
            key={v}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yFor(v)}
            y2={yFor(v)}
            className="rstats-chart__grid"
          />
        ))}

        {areaPath && <path d={areaPath} fill={`url(#fill-${gid})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="rgb(var(--brand-rgb))"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {coords.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="var(--surface)"
            stroke="rgb(var(--brand-rgb))"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="rstats-chart__labels">
        {points.map((p, i) =>
          p.label ? (
            <span key={i} style={{ left: `${(xFor(i) / W) * 100}%` }}>
              {p.label}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

export default function RoutineStats() {
  const t = useTranslations("stats");
  const td = useTranslations("days");
  const { routines, getStatus } = useRoutines();
  const [range, setRange] = useState<Range>("daily");

  const today = useMemo(() => new Date(), []);
  const todayK = dateKey(today);

  const daily = useMemo(
    () => dayAggregate(routines, getStatus, today),
    [routines, getStatus, today],
  );

  const weekly = useMemo<Point[]>(() => {
    const labels = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    return weekDays(today).map((d, i) => ({
      label: td(labels[i]!),
      value: dayAggregate(routines, getStatus, d).rate,
      muted: dateKey(d) > todayK,
    }));
  }, [routines, getStatus, today, td, todayK]);

  const monthly = useMemo<Point[]>(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const n = daysInMonth(year, month);
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        label: i % 5 === 0 || i === n - 1 ? String(i + 1) : "",
        value: dayAggregate(routines, getStatus, d).rate,
        muted: dateKey(d) > todayK,
      };
    });
  }, [routines, getStatus, today, todayK]);

  const yearly = useMemo<Point[]>(() => {
    const year = today.getFullYear();
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    return months.map((label, m) => {
      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      const muted = first > today;
      const end = last > today ? today : last;
      return {
        label,
        value: muted ? 0 : rangeCompletion(routines, getStatus, first, end),
        muted,
      };
    });
  }, [routines, getStatus, today]);

  if (routines.length === 0) {
    return <EmptyState title={t("noData")} compact />;
  }

  return (
    <div className="rstats">
      <SegmentedControl<Range>
        segments={[
          { value: "daily", label: t("daily") },
          { value: "weekly", label: t("weekly") },
          { value: "monthly", label: t("monthly") },
          { value: "yearly", label: t("yearly") },
        ]}
        value={range}
        onChange={setRange}
        size="sm"
        fullWidth
      />

      {range === "daily" && (
        <div className="rstats__daily">
          <ProgressRing
            value={daily.rate}
            label={`${daily.rate}%`}
            sublabel={t("dailyCompletion")}
          />
          <div className="rstats__counts">
            <div className="rstats__count rstats__count--done">
              <span className="rstats__count-num">{daily.completed}</span>
              <span className="rstats__count-label">{t("completed")}</span>
            </div>
            <div className="rstats__count rstats__count--pending">
              <span className="rstats__count-num">{daily.pending}</span>
              <span className="rstats__count-label">{t("pending")}</span>
            </div>
            <div className="rstats__count rstats__count--skipped">
              <span className="rstats__count-num">{daily.skipped}</span>
              <span className="rstats__count-label">{t("skipped")}</span>
            </div>
          </div>
        </div>
      )}

      {range === "weekly" && (
        <div className="rstats__panel">
          <h3 className="rstats__panel-title">{t("byDay")}</h3>
          <LineChart points={weekly} />
        </div>
      )}

      {range === "monthly" && (
        <div className="rstats__panel">
          <h3 className="rstats__panel-title">{t("habitEvolution")}</h3>
          <LineChart points={monthly} />
        </div>
      )}

      {range === "yearly" && (
        <div className="rstats__panel">
          <h3 className="rstats__panel-title">{t("yearlyPerformance")}</h3>
          <LineChart points={yearly} />
        </div>
      )}
    </div>
  );
}
