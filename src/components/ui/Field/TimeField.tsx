"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import "./Field.scss";

interface TimeFieldProps {
  /** Hora en formato "HH:mm". */
  value: string;
  onChange: (value: string) => void;
  /** Paso de los minutos (default 1: todos). El valor actual siempre es seleccionable. */
  minuteStep?: number;
  disabled?: boolean;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Selector de hora propio (no nativo): dos columnas scrolleables (hora y
 * minuto) en un popover. Reemplaza a `<input type="time">` para tener una UI
 * consistente y bien posicionada en mobile (el picker nativo del SO no se
 * puede estilar y en algunos dispositivos recorta los botones).
 */
export default function TimeField({
  value,
  onChange,
  minuteStep = 1,
  disabled,
  className = "",
}: TimeFieldProps) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
    up: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLUListElement>(null);
  const minListRef = useRef<HTMLUListElement>(null);

  const [hStr = "00", mStr = "00"] = (value || "00:00").split(":");

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => pad(i)),
    [],
  );
  const minutes = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < 60; i += minuteStep) set.add(pad(i));
    set.add(mStr); // incluir el valor actual aunque esté fuera de grilla
    return [...set].sort();
  }, [minuteStep, mStr]);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuW = Math.max(r.width, 200);
    const estH = 296;
    const below = window.innerHeight - r.bottom;
    const up = below < estH && r.top > below;
    // Clamp dentro del viewport para que nunca se recorte (8px de margen)
    let left = Math.min(r.left, window.innerWidth - menuW - 8);
    left = Math.max(8, left);
    setPos({
      left,
      top: up ? r.top - 4 : r.bottom + 4,
      width: menuW,
      up,
    });
  }, []);

  useEffect(() => {
    if (open) place();
  }, [open, place]);

  // Centrar el valor seleccionado al abrir
  useEffect(() => {
    if (!open || !pos) return;
    requestAnimationFrame(() => {
      [hourListRef, minListRef].forEach((ref) => {
        const c = ref.current;
        if (!c) return;
        const sel = c.querySelector<HTMLElement>(".fl-time__opt--sel");
        if (sel)
          c.scrollTop =
            sel.offsetTop - c.clientHeight / 2 + sel.clientHeight / 2;
      });
    });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (triggerRef.current?.contains(tgt) || menuRef.current?.contains(tgt))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReflow = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open]);

  const setHour = (h: string) => onChange(`${h}:${mStr}`);
  const setMinute = (m: string) => onChange(`${hStr}:${m}`);

  return (
    <div className={`fl-dd ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`fl-input fl-dd__trigger fl-time__trigger ${
          open ? "fl-dd__trigger--open" : ""
        }`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="fl-dd__value">{value || "--:--"}</span>
        <ScheduleRoundedIcon className="fl-time__icon" />
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fl-dd__menu fl-time__menu"
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up
                ? { bottom: window.innerHeight - pos.top }
                : { top: pos.top }),
            }}
            role="dialog"
          >
            <div className="fl-time__head">
              {hStr}:{mStr}
            </div>
            <div className="fl-time__cols">
              <ul ref={hourListRef} className="fl-time__col">
                {hours.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      className={`fl-time__opt ${
                        h === hStr ? "fl-time__opt--sel" : ""
                      }`}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
              <span className="fl-time__divider" />
              <ul ref={minListRef} className="fl-time__col">
                {minutes.map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      className={`fl-time__opt ${
                        m === mStr ? "fl-time__opt--sel" : ""
                      }`}
                      onClick={() => setMinute(m)}
                    >
                      {m}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="fl-time__done"
              onClick={() => setOpen(false)}
            >
              {tc("done")}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
