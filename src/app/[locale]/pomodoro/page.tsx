"use client";
import { useTranslations } from "next-intl";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer/PomodoroTimer";
import PomodoroSettings from "@/components/pomodoro/PomodoroSettings/PomodoroSettings";
import "./pomodoro.scss";

export default function PomodoroPage() {
  const t = useTranslations("pomodoro");

  return (
    <div className="page pomodoro">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
      </header>

      <div className="pomodoro__layout">
        <div className="pomodoro__main">
          <PomodoroTimer />
        </div>
        <div className="pomodoro__aside">
          <PomodoroSettings />
        </div>
      </div>
    </div>
  );
}
