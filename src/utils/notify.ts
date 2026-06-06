/** Dispara una notificación del navegador si hay permiso concedido. */
export function notify(title: string, body?: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/icon.svg" });
  } catch {
    /* algunos navegadores requieren ServiceWorker para notificar */
  }
}
