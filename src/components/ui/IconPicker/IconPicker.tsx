"use client";
import { useTranslations } from "next-intl";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import { PRESET_ICONS, ICON_MAP } from "@/utils/icons";
import "./IconPicker.scss";

interface IconPickerProps {
  /** Clave del icono seleccionado. "" = sin icono. */
  value: string;
  onChange: (icon: string) => void;
  /** Color de acento para tintar el icono activo (ej. el color elegido). */
  accent?: string;
}

export default function IconPicker({ value, onChange, accent }: IconPickerProps) {
  const tc = useTranslations("common");
  const ti = useTranslations("icons");

  return (
    <div className="fl-iconpicker" role="radiogroup" aria-label={tc("icon")}>
      <button
        type="button"
        role="radio"
        aria-checked={value === ""}
        aria-label={tc("noIcon")}
        title={tc("noIcon")}
        className="fl-iconpicker__btn fl-iconpicker__btn--none"
        onClick={() => onChange("")}
      >
        <DoNotDisturbAltRoundedIcon />
      </button>

      {PRESET_ICONS.map((key) => {
        const Icon = ICON_MAP[key]!;
        const active = value === key;
        // Fallback a la clave si el icono aún no tiene traducción (no rompe la UI)
        const label = ti.has(key) ? ti(key) : key;
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
            onClick={() => onChange(key)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
