import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const hasConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Placeholders inofensivos para que la app arranque sin `.env.local` (muestra
// la pantalla de login). Las acciones reales de auth/Firestore fallarán hasta
// que completes las credenciales — ver `.env.local.example`.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "flowly-missing-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "flowly.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "flowly",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "flowly.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "flowly",
};

if (!hasConfig && typeof window !== "undefined") {
  console.warn(
    "[Flowly] Falta configurar Firebase. Copiá .env.local.example a .env.local y completá tus credenciales.",
  );
}

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseReady = hasConfig;
export default app;
