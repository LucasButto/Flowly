"use client";
import { ReactNode } from "react";
import { Link } from "@/navigation";
import "./StatCard.scss";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accent?: string; // CSS color
  href?: string; // si está, la card navega a esa sección
}

export default function StatCard({
  icon,
  value,
  label,
  accent = "var(--brand)",
  href,
}: StatCardProps) {
  const inner = (
    <>
      <span
        className="stat-card__icon"
        style={{
          color: accent,
          background: `color-mix(in srgb, ${accent} 14%, transparent)`,
        }}
      >
        {icon}
      </span>
      <div className="stat-card__info">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card stat-card--link">
        {inner}
      </Link>
    );
  }
  return <div className="stat-card">{inner}</div>;
}
