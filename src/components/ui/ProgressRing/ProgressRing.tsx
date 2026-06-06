"use client";
import { clamp } from "@/utils/format";
import "./ProgressRing.scss";

interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = "var(--brand)",
  label,
  sublabel,
}: ProgressRingProps) {
  const pct = clamp(value, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="fl-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="fl-ring__svg">
        <circle
          className="fl-ring__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="fl-ring__fg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="fl-ring__center">
        <span className="fl-ring__value">{label ?? `${pct}%`}</span>
        {sublabel && <span className="fl-ring__sub">{sublabel}</span>}
      </div>
    </div>
  );
}
