"use client";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import "./ActionMenu.scss";

export interface ActionMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** aria-label del botón de 3 puntos. */
  label: string;
  size?: "sm" | "md";
  /** Clase extra para el botón disparador. */
  className?: string;
}

const MENU_W = 190;

/** Menú "kebab" (3 puntitos) con opciones (icono + texto), tipo WhatsApp. */
export default function ActionMenu({
  items,
  label,
  size = "sm",
  className = "",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estH = items.length * 42 + 12;
    const below = window.innerHeight - r.bottom;
    const up = below < estH && r.top > below;
    // alinear el borde derecho del menú con el del botón, sin salirse del viewport
    let left = r.right - MENU_W;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
    setPos({ left, top: up ? r.top - 4 : r.bottom + 4, up });
  }, [items.length]);

  useEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReflow = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`fl-iconbtn fl-iconbtn--${size} fl-iconbtn--ghost ${className}`}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreVertRoundedIcon />
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fl-menu"
            style={{
              left: pos.left,
              width: MENU_W,
              ...(pos.up
                ? { bottom: window.innerHeight - pos.top }
                : { top: pos.top }),
            }}
            role="menu"
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={`fl-menu__item ${
                  item.danger ? "fl-menu__item--danger" : ""
                }`}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <span className="fl-menu__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
