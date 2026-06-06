import type { CSSProperties } from "react";
import "./Skeleton.scss";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
}

/** Bloque con animación shimmer para estados de carga. */
export default function Skeleton({
  width,
  height,
  radius,
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      className={`fl-sk ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden
    />
  );
}
