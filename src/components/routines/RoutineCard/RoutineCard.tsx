"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useRoutines } from "@/contexts/RoutinesContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { todayKey } from "@/utils/dates";
import { contrastText } from "@/utils/colors";
import { DAY_KEYS, WEEK_ORDER } from "@/types/common";
import type { Routine } from "@/types/routine";
import "./RoutineCard.scss";

interface RoutineCardProps {
  routine: Routine;
  mode: "today" | "all";
  /** Muestra el lápiz de editar en modo "today" (no en el dashboard). */
  showEdit?: boolean;
  /** Si está, muestra un botón para abrir la sección de rutinas. */
  openHref?: string;
  onEdit: (r: Routine) => void;
  onDelete: (r: Routine) => void;
}

export default function RoutineCard({
  routine,
  mode,
  showEdit = false,
  openHref,
  onEdit,
  onDelete,
}: RoutineCardProps) {
  const t = useTranslations("routines");
  const tc = useTranslations("common");
  const td = useTranslations("days");
  const tf = useTranslations("frequency");
  const ts = useTranslations("status");
  const { getStatus, setStatus, statsOf } = useRoutines();

  const key = todayKey();
  const status = getStatus(routine.id, key);
  const stats = statsOf(routine);

  const daysLabel = () => {
    if (routine.frequency === "daily") return tf("daily");
    if (routine.frequency === "weekdays") return tf("weekdays");
    return WEEK_ORDER.filter((d) => routine.days.includes(d))
      .map((d) => td(DAY_KEYS[d]))
      .join(" · ");
  };

  return (
    <article
      className={`routine-card routine-card--${status}`}
      style={{ "--accent": routine.color } as React.CSSProperties}
    >
      <span className="routine-card__bar" />

      <div className="routine-card__body">
        <div className="routine-card__head">
          <div className="routine-card__title-wrap">
            <h3 className="routine-card__title">{routine.name}</h3>
            <div className="routine-card__meta">
              <span className="routine-card__time">
                <ScheduleRoundedIcon />
                {routine.startTime}–{routine.endTime}
              </span>
              {routine.tag && <span className="chip">{routine.tag}</span>}
            </div>
          </div>

          {(mode === "all" ||
            (mode === "today" && showEdit) ||
            openHref) && (
            <div className="routine-card__tools">
              {openHref && (
                <Link
                  href={openHref}
                  className="fl-iconbtn fl-iconbtn--sm fl-iconbtn--ghost"
                  aria-label={t("open")}
                  title={t("open")}
                >
                  <OpenInNewRoundedIcon />
                </Link>
              )}
              {(mode === "all" || (mode === "today" && showEdit)) && (
                <IconButton
                  label={tc("edit")}
                  size="sm"
                  onClick={() => onEdit(routine)}
                >
                  <EditRoundedIcon />
                </IconButton>
              )}
              {mode === "all" && (
                <IconButton
                  label={tc("delete")}
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(routine)}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              )}
            </div>
          )}
        </div>

        {routine.description && (
          <p className="routine-card__desc">{routine.description}</p>
        )}

        {mode === "all" && (
          <>
            <div className="routine-card__daypills" aria-label={daysLabel()}>
              {WEEK_ORDER.map((d) => {
                const on = routine.days.includes(d);
                return (
                  <span
                    key={d}
                    className={`routine-card__pill ${
                      on ? "routine-card__pill--on" : ""
                    }`}
                    style={
                      on
                        ? {
                            background: routine.color,
                            borderColor: routine.color,
                            color: contrastText(routine.color),
                          }
                        : undefined
                    }
                    title={td(`${DAY_KEYS[d]}Long`)}
                  >
                    {td(DAY_KEYS[d]).charAt(0)}
                  </span>
                );
              })}
              {routine.frequency !== "custom" && (
                <span className="routine-card__freq">{daysLabel()}</span>
              )}
            </div>

            <div className="routine-card__stats">
              <span className="routine-card__stat routine-card__stat--streak">
                <LocalFireDepartmentRoundedIcon />
                {stats.currentStreak} {t("days")}
              </span>
              <span className="routine-card__stat">
                {t("bestStreak")}: <strong>{stats.bestStreak}</strong>
              </span>
              <span className="routine-card__stat">
                {t("completionRate")}: <strong>{stats.completionRate}%</strong>
              </span>
            </div>
          </>
        )}

        {mode === "today" && (
          <div className="routine-card__actions">
            {status === "pending" ? (
              <>
                <button
                  className="routine-card__btn routine-card__btn--complete"
                  onClick={() => setStatus(routine.id, key, "completed")}
                >
                  <CheckRoundedIcon /> {t("markCompleted")}
                </button>
                <button
                  className="routine-card__btn routine-card__btn--skip"
                  onClick={() => setStatus(routine.id, key, "skipped")}
                >
                  <RemoveRoundedIcon /> {t("markSkipped")}
                </button>
              </>
            ) : (
              <button
                className={`routine-card__state routine-card__state--${status}`}
                onClick={() => setStatus(routine.id, key, "pending")}
                title={t("markPending")}
              >
                {status === "completed" ? (
                  <CheckRoundedIcon />
                ) : (
                  <CloseRoundedIcon />
                )}
                {ts(status)}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
