"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import "./IconButton.scss";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  size?: "sm" | "md";
  variant?: "default" | "ghost" | "danger";
}

export default function IconButton({
  children,
  label,
  size = "md",
  variant = "ghost",
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`fl-iconbtn fl-iconbtn--${size} fl-iconbtn--${variant} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
