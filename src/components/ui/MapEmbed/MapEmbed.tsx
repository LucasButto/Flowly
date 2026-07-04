"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import "./MapEmbed.scss";

interface MapEmbedProps {
  location: string;
  className?: string;
  /** ms de espera tras dejar de tipear antes de recargar el mapa. 0 = inmediato. */
  debounceMs?: number;
}

/**
 * Mini-mapa embebido de Google Maps (iframe clásico, sin API key).
 * Con `debounceMs` espera a que el usuario deje de tipear antes de recargar,
 * para usarlo en vivo dentro de un formulario sin recargar en cada tecla.
 */
export default function MapEmbed({
  location,
  className = "",
  debounceMs = 0,
}: MapEmbedProps) {
  const tc = useTranslations("common");
  const [value, setValue] = useState(location.trim());

  useEffect(() => {
    const next = location.trim();
    if (debounceMs <= 0) {
      setValue(next);
      return;
    }
    const id = setTimeout(() => setValue(next), debounceMs);
    return () => clearTimeout(id);
  }, [location, debounceMs]);

  if (!value) return null;
  // El link pegado de Maps no embebe bien; para esos casos no mostramos iframe.
  if (/^https?:\/\//i.test(value)) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    value,
  )}&z=15&output=embed`;

  return (
    <iframe
      className={`fl-mapembed ${className}`}
      title={`${tc("viewOnMap")}: ${value}`}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
