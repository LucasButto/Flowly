"use client";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/layout/Sidebar/Sidebar";
import Brand from "@/components/layout/Brand/Brand";
import Spinner from "@/components/ui/Spinner/Spinner";
import EventReminders from "@/components/events/EventReminders/EventReminders";
import "./LoginGate.scss";

export default function LoginGate({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const t = useTranslations("login");

  if (loading) {
    return (
      <div className="login-loader">
        <Brand size={48} />
        <Spinner />
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">{children}</div>
      <EventReminders />
    </div>
  );
}

function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const toast = useToast();

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      toast(t("error"), "error");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-screen__aside">
        <div className="login-screen__aside-content">
          <Brand size={42} />
          <h1 className="login-screen__headline">
            Tu día, <span>en flow.</span>
          </h1>
          <p className="login-screen__pitch">
            Hábitos, rutinas, tareas y eventos — todo en un solo lugar.
          </p>
          <ul className="login-screen__features">
            <li>Construí hábitos con seguimiento de rachas</li>
            <li>Organizá tareas en listas con drag &amp; drop</li>
            <li>Planificá eventos y enfocá con Pomodoro</li>
          </ul>
        </div>
        <div className="login-screen__glow" />
      </div>

      <div className="login-screen__main">
        <div className="login-screen__card">
          <div className="login-screen__card-brand">
            <Brand size={40} />
          </div>
          <h2 className="login-screen__welcome">{t("welcome")}</h2>
          <p className="login-screen__sub">{t("subtitle")}</p>
          <button className="login-screen__google" onClick={handleGoogle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google-icon.svg" alt="" width={20} height={20} />
            {t("google")}
          </button>
          <p className="login-screen__legal">
            {tc("appName")} · {tc("tagline")}
          </p>
        </div>
      </div>
    </div>
  );
}
