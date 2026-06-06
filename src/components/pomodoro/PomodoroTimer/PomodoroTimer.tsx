"use client";
import { useTranslations } from "next-intl";
import { usePomodoro } from "@/contexts/PomodoroContext";
import ProgressRing from "@/components/ui/ProgressRing/ProgressRing";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import "./PomodoroTimer.scss";

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTimer() {
  const t = useTranslations("pomodoro");
  const {
    phase,
    remaining,
    totalSeconds,
    running,
    cycle,
    config,
    link,
    activeName,
    start,
    pause,
    reset,
    skip,
  } = usePomodoro();

  const progress = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  const color = phase === "work" ? "var(--brand)" : "var(--success)";

  return (
    <div className={`pomo-timer pomo-timer--${phase}`}>
      {activeName && <span className="pomo-timer__name">{activeName}</span>}
      <span className="pomo-timer__phase" style={{ color }}>
        {phase === "work" ? t("focus") : t("break")}
      </span>

      <ProgressRing
        value={progress}
        size={260}
        stroke={14}
        color={color}
        label={mmss(remaining)}
        sublabel={t("cycle", { current: cycle, total: config.cycles })}
      />

      {link.type !== "none" && link.label && (
        <p className="pomo-timer__link">
          {t("linkLabel")}: <strong>{link.label}</strong>
        </p>
      )}

      <div className="pomo-timer__controls">
        <IconButton label={t("reset")} variant="default" onClick={reset}>
          <RestartAltRoundedIcon />
        </IconButton>

        {running ? (
          <Button size="lg" icon={<PauseRoundedIcon />} onClick={pause}>
            {t("pause")}
          </Button>
        ) : (
          <Button size="lg" icon={<PlayArrowRoundedIcon />} onClick={start}>
            {remaining < totalSeconds ? t("resume") : t("start")}
          </Button>
        )}

        <IconButton label={t("skip")} variant="default" onClick={skip}>
          <SkipNextRoundedIcon />
        </IconButton>
      </div>
    </div>
  );
}
