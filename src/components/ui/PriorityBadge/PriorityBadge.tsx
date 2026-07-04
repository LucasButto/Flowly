"use client";
import { useTranslations } from "next-intl";
import type { Priority } from "@/types/common";
import "./PriorityBadge.scss";

interface PriorityBadgeProps {
  priority?: Priority | "";
  className?: string;
}

export default function PriorityBadge({
  priority,
  className = "",
}: PriorityBadgeProps) {
  const tp = useTranslations("priority");
  if (!priority) return null;

  return (
    <span className={`fl-prioritybadge fl-prioritybadge--${priority} ${className}`}>
      {tp(priority)}
    </span>
  );
}
