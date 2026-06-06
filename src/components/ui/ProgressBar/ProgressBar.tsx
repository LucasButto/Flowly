"use client";
import { clamp } from "@/utils/format";
import "./ProgressBar.scss";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  color,
  height = 8,
  showLabel = false,
}: ProgressBarProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div className="fl-progress">
      <div className="fl-progress__track" style={{ height }}>
        <div
          className="fl-progress__fill"
          style={{
            width: `${pct}%`,
            background: color ?? "var(--brand-gradient)",
          }}
        />
      </div>
      {showLabel && <span className="fl-progress__label">{pct}%</span>}
    </div>
  );
}
