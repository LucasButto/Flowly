"use client";
import { useTranslations } from "next-intl";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { mapsUrl } from "@/utils/maps";
import "./MapLink.scss";

interface MapLinkProps {
  location: string;
  className?: string;
  /** Muestra un icono de "abrir link" al final para dejar claro que es clickeable. */
  showOpenIcon?: boolean;
}

/**
 * Muestra una ubicación como link a Google Maps. El texto mostrado es la
 * ubicación tal cual; al hacer click abre Maps en otra pestaña.
 */
export default function MapLink({
  location,
  className = "",
  showOpenIcon = false,
}: MapLinkProps) {
  const tc = useTranslations("common");
  const value = location.trim();
  if (!value) return null;

  return (
    <a
      className={`fl-maplink ${className}`}
      href={mapsUrl(value)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`${tc("viewOnMap")}: ${value}`}
    >
      <PlaceRoundedIcon />
      <span className="fl-maplink__text">{value}</span>
      {showOpenIcon && (
        <OpenInNewRoundedIcon className="fl-maplink__ext" aria-hidden="true" />
      )}
    </a>
  );
}
