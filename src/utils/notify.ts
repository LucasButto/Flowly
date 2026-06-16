// ─── Notificaciones del navegador + sonido ──────────────────────────────────
// Estrategia: usar el Service Worker (registration.showNotification) que es lo
// fiable en desktop y Android; si no hay SW, caer a `new Notification`.
// El sonido se genera con Web Audio (no requiere assets) y se desbloquea con
// un gesto del usuario (toggle / botón de prueba / primer click).

let swRegistration: ServiceWorkerRegistration | null = null;

/** Registra el service worker (idempotente). Devuelve la registración o null. */
export async function registerNotificationSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  if (swRegistration) return swRegistration;
  try {
    swRegistration =
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    return swRegistration;
  } catch {
    return null;
  }
}

/** Pide permiso de notificaciones. Devuelve true si quedó concedido. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  } catch {
    return false;
  }
}

interface NotifyOptions {
  body?: string;
  tag?: string;
  /** URL a abrir al tocar la notificación. */
  url?: string;
}

/**
 * Muestra una notificación del sistema si hay permiso. Devuelve true si se
 * mostró. (El sonido se maneja aparte con `playChime`.)
 */
export async function notify(
  title: string,
  { body, tag, url = "/" }: NotifyOptions = {},
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const options: NotificationOptions & { data?: unknown } = {
    body,
    tag,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url },
  };

  // 1) vía Service Worker (lo más compatible)
  try {
    const reg = await registerNotificationSW();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    /* sigue al fallback */
  }

  // 2) fallback al constructor directo
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

// ─── Sonido (Web Audio) ──────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/** Crea/resucita el AudioContext dentro de un gesto del usuario. */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export type ChimeDuration = "short" | "medium" | "long";

interface Tone {
  freq: number; // Hz
  at: number; // offset de inicio (s)
  dur: number; // duración (s)
}

// Patrones de campanita por duración (corto ≈0.5s, mediano ≈1.1s, largo ≈2.1s).
const CHIME_PATTERNS: Record<ChimeDuration, Tone[]> = {
  // corto = el "mediano" anterior (2 tonos)
  short: [
    { freq: 880, at: 0, dur: 0.28 },
    { freq: 1174.66, at: 0.14, dur: 0.3 },
  ],
  // mediano = el "largo" anterior (4 tonos)
  medium: [
    { freq: 880, at: 0, dur: 0.3 },
    { freq: 1174.66, at: 0.18, dur: 0.3 },
    { freq: 988, at: 0.42, dur: 0.3 },
    { freq: 1318.51, at: 0.62, dur: 0.5 },
  ],
  // largo = nuevo, más extenso (7 tonos, arpegio ascendente)
  long: [
    { freq: 880, at: 0, dur: 0.3 },
    { freq: 1174.66, at: 0.18, dur: 0.3 },
    { freq: 988, at: 0.42, dur: 0.3 },
    { freq: 1318.51, at: 0.62, dur: 0.35 },
    { freq: 1046.5, at: 0.92, dur: 0.35 },
    { freq: 1318.51, at: 1.2, dur: 0.4 },
    { freq: 1567.98, at: 1.5, dur: 0.6 },
  ],
};

/** Campanita para acompañar la notificación; `duration` ajusta su largo. */
export function playChime(duration: ChimeDuration = "medium") {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  try {
    const now = ctx.currentTime;
    for (const tone of CHIME_PATTERNS[duration]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = tone.freq;
      const start = now + tone.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + tone.dur + 0.05);
    }
  } catch {
    /* sin sonido si el contexto no está disponible */
  }
}
