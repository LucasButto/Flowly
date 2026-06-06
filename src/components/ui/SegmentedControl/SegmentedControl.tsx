"use client";
import { ReactNode } from "react";
import "./SegmentedControl.scss";

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  size = "md",
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`fl-seg fl-seg--${size} ${fullWidth ? "fl-seg--full" : ""}`}
      role="tablist"
    >
      {segments.map((seg) => (
        <button
          key={seg.value}
          type="button"
          role="tab"
          aria-selected={value === seg.value}
          className={`fl-seg__item ${
            value === seg.value ? "fl-seg__item--active" : ""
          }`}
          onClick={() => onChange(seg.value)}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}
