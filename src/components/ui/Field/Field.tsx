"use client";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import "./Field.scss";

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export default function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FieldProps) {
  const tc = useTranslations("common");
  return (
    <div className={`fl-field ${error ? "fl-field--error" : ""}`}>
      {label && (
        <label className="fl-field__label" htmlFor={htmlFor}>
          {label}
          {optional && (
            <span className="fl-field__optional">{tc("optional")}</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <span className="fl-field__error">{error}</span>
      ) : hint ? (
        <span className="fl-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
