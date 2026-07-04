/**
 * Devuelve una URL para abrir la ubicación en Google Maps.
 * Si el texto ya es un link (http/https), se usa tal cual (p. ej. un link
 * de Maps pegado por el usuario). Si no, se hace una búsqueda por texto.
 */
export function mapsUrl(location: string): string {
  const q = location.trim();
  if (/^https?:\/\//i.test(q)) return q;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
