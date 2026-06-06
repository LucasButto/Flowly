"use client";
import { ReactNode } from "react";
import "./StatCard.scss";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accent?: string; // CSS color
}

export default function StatCard({
  icon,
  value,
  label,
  accent = "var(--brand)",
}: StatCardProps) {
  return (
    <div className="stat-card">
      <span
        className="stat-card__icon"
        style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
      >
        {icon}
      </span>
      <div className="stat-card__info">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </div>
  );
}
