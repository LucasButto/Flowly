"use client";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import "./Field.scss";

interface OptionData {
  value: string;
  label: ReactNode;
  text: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode; // elementos <option>
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/** Texto plano de un ReactNode (para buscar y mostrar en el trigger). */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node))
    return nodeText((node.props as { children?: ReactNode }).children);
  return "";
}

const MENU_MAX = 300;

/**
 * Select con dropdown propio (no nativo) para poder estilar el menú abierto.
 * Mantiene la API de `<Select value onChange><option/></Select>` salvo que
 * `onChange` recibe el valor directamente (no un evento).
 */
export default function Select({
  value,
  onChange,
  children,
  disabled,
  className = "",
  placeholder,
}: SelectProps) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
    up: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options = useMemo<OptionData[]>(() => {
    const out: OptionData[] = [];
    Children.toArray(children).forEach((child) => {
      if (isValidElement(child) && child.type === "option") {
        const props = child.props as {
          value?: string | number;
          children?: ReactNode;
        };
        out.push({
          value: String(props.value ?? ""),
          label: props.children,
          text: nodeText(props.children),
        });
      }
    });
    return out;
  }, [children]);

  const selected = options.find((o) => o.value === value);
  const searchable = options.length > 8;
  const filtered =
    searchable && query.trim()
      ? options.filter((o) =>
          o.text.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : options;

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estH = Math.min(
      options.length * 38 + (searchable ? 46 : 0) + 8,
      MENU_MAX,
    );
    const below = window.innerHeight - r.bottom;
    const up = below < estH && r.top > below;
    setPos({
      left: r.left,
      top: up ? r.top - 4 : r.bottom + 4,
      width: r.width,
      up,
    });
  }, [options.length, searchable]);

  useEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (triggerRef.current?.contains(tgt) || menuRef.current?.contains(tgt))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className={`fl-dd ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`fl-input fl-dd__trigger ${open ? "fl-dd__trigger--open" : ""}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`fl-dd__value ${!selected ? "fl-dd__value--ph" : ""}`}
        >
          {selected ? selected.label : (placeholder ?? "")}
        </span>
        <KeyboardArrowDownRoundedIcon className="fl-dd__arrow" />
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fl-dd__menu"
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up
                ? { bottom: window.innerHeight - pos.top }
                : { top: pos.top }),
              maxHeight: MENU_MAX,
            }}
            role="listbox"
          >
            {searchable && (
              <div className="fl-dd__search">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tc("searchPlaceholder")}
                />
              </div>
            )}
            <ul className="fl-dd__options">
              {filtered.length === 0 && (
                <li className="fl-dd__empty">{tc("noResults")}</li>
              )}
              {filtered.map((o) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  className={`fl-dd__option ${
                    o.value === value ? "fl-dd__option--sel" : ""
                  }`}
                  onClick={() => choose(o.value)}
                >
                  {o.label}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
