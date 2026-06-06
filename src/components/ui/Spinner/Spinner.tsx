"use client";
import "./Spinner.scss";

interface SpinnerProps {
  size?: number;
  center?: boolean;
}

export default function Spinner({ size = 28, center = false }: SpinnerProps) {
  const spinner = (
    <span
      className="fl-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 12) }}
    />
  );
  if (!center) return spinner;
  return <div className="fl-spinner-center">{spinner}</div>;
}
