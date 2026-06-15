"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FlowIcon, { PRESET_ICONS, ICON_MAP } from "@/utils/icons";
import "./IconPicker.scss";

interface IconPickerProps {
  /** Clave del icono seleccionado. "" = sin icono. */
  value: string;
  onChange: (icon: string) => void;
  /** Color de acento para tintar el icono elegido. */
  accent?: string;
}

export default function IconPicker({ value, onChange, accent }: IconPickerProps) {
  const tc = useTranslations("common");
  const ti = useTranslations("icons");
  const [open, setOpen] = useState(false);

  // Escape cierra SOLO el popup. Se escucha en fase de captura y se corta la
  // propagación para que el Modal del formulario que lo contiene no se cierre.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  const labelFor = (key: string) => (ti.has(key) ? ti(key) : key);
  const triggerLabel = value ? labelFor(value) : tc("noIcon");

  const select = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="fl-iconpicker-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className="fl-iconpicker-trigger__icon"
          style={value && accent ? { color: accent } : undefined}
        >
          {value ? <FlowIcon name={value} /> : <DoNotDisturbAltRoundedIcon />}
        </span>
        <span className="fl-iconpicker-trigger__label">{triggerLabel}</span>
        <KeyboardArrowDownRoundedIcon className="fl-iconpicker-trigger__caret" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fl-iconpicker-pop" role="dialog" aria-modal="true">
            <div
              className="fl-iconpicker-pop__overlay"
              onClick={() => setOpen(false)}
            />
            <div className="fl-iconpicker-pop__panel">
              <header className="fl-iconpicker-pop__head">
                <span className="fl-iconpicker-pop__title">{tc("icon")}</span>
                <button
                  type="button"
                  className="fl-iconpicker-pop__close"
                  onClick={() => setOpen(false)}
                  aria-label={tc("close")}
                >
                  <CloseRoundedIcon />
                </button>
              </header>

              <div
                className="fl-iconpicker"
                role="radiogroup"
                aria-label={tc("icon")}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={value === ""}
                  aria-label={tc("noIcon")}
                  title={tc("noIcon")}
                  className="fl-iconpicker__btn fl-iconpicker__btn--none"
                  onClick={() => select("")}
                >
                  <DoNotDisturbAltRoundedIcon />
                </button>

                {PRESET_ICONS.map((key) => {
                  const Icon = ICON_MAP[key]!;
                  const active = value === key;
                  const label = labelFor(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={label}
                      title={label}
                      className={`fl-iconpicker__btn ${active ? "fl-iconpicker__btn--active" : ""}`}
                      style={active && accent ? { color: accent } : undefined}
                      onClick={() => select(key)}
                    >
                      <Icon />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
