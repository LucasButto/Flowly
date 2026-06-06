"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.scss";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  iconRight,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`fl-btn fl-btn--${variant} fl-btn--${size} ${
        fullWidth ? "fl-btn--full" : ""
      } ${loading ? "fl-btn--loading" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="fl-btn__spinner" aria-hidden />}
      {!loading && icon && <span className="fl-btn__icon">{icon}</span>}
      {children && <span className="fl-btn__label">{children}</span>}
      {!loading && iconRight && <span className="fl-btn__icon">{iconRight}</span>}
    </button>
  );
}
