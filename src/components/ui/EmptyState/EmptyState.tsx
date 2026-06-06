"use client";
import { ReactNode } from "react";
import "./EmptyState.scss";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`fl-empty ${compact ? "fl-empty--compact" : ""}`}>
      {icon && <div className="fl-empty__icon">{icon}</div>}
      <h3 className="fl-empty__title">{title}</h3>
      {description && <p className="fl-empty__desc">{description}</p>}
      {action && <div className="fl-empty__action">{action}</div>}
    </div>
  );
}
