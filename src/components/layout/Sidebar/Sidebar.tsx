"use client";
import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import Brand from "@/components/layout/Brand/Brand";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { ReactNode } from "react";
import "./Sidebar.scss";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/", label: t("dashboard"), icon: <SpaceDashboardRoundedIcon /> },
    { href: "/routines", label: t("routines"), icon: <AutorenewRoundedIcon /> },
    { href: "/todo", label: t("todo"), icon: <ChecklistRoundedIcon /> },
    { href: "/events", label: t("events"), icon: <CalendarMonthRoundedIcon /> },
    { href: "/pomodoro", label: t("pomodoro"), icon: <TimerRoundedIcon /> },
    { href: "/settings", label: t("settings"), icon: <SettingsRoundedIcon /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const close = () => setOpen(false);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar con Escape + bloquear scroll del body cuando está abierto (mobile)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* ─── Top bar mobile ─── */}
      <header className="fl-topbar">
        <Link href="/" className="fl-topbar__brand" onClick={close}>
          <Brand size={30} />
        </Link>
        <button
          className="fl-topbar__burger"
          onClick={() => setOpen(true)}
          aria-label={t("menu")}
        >
          <MenuRoundedIcon />
        </button>
      </header>

      {/* ─── Overlay (mobile) ─── */}
      <div
        className={`fl-sidebar__overlay ${open ? "fl-sidebar__overlay--visible" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ─── Sidebar: rail en desktop / drawer en mobile ─── */}
      <aside className={`fl-sidebar ${open ? "fl-sidebar--open" : ""}`}>
        <div className="fl-sidebar__top">
          <Link href="/" className="fl-sidebar__brand" onClick={close}>
            <Brand />
          </Link>
          <button
            className="fl-sidebar__close"
            onClick={close}
            aria-label={t("menu")}
          >
            <CloseRoundedIcon />
          </button>
        </div>

        <nav className="fl-sidebar__nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`fl-sidebar__link ${
                isActive(item.href) ? "fl-sidebar__link--active" : ""
              }`}
              onClick={close}
            >
              <span className="fl-sidebar__icon">{item.icon}</span>
              <span className="fl-sidebar__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="fl-sidebar__lang">
          <LanguageSwitcher />
        </div>

        <div className="fl-sidebar__footer">
          <Link href="/settings" className="fl-sidebar__profile" onClick={close}>
            <span className="fl-sidebar__avatar">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  width={36}
                  height={36}
                />
              ) : (
                <span>{user?.displayName?.[0]?.toUpperCase() ?? "U"}</span>
              )}
            </span>
            <span className="fl-sidebar__profile-info">
              <span className="fl-sidebar__profile-name">
                {user?.displayName ?? "Usuario"}
              </span>
              <span className="fl-sidebar__profile-email">{user?.email}</span>
            </span>
          </Link>
          <button
            className="fl-sidebar__logout"
            onClick={handleLogout}
            aria-label={t("logout")}
            title={t("logout")}
          >
            <LogoutRoundedIcon />
          </button>
        </div>
      </aside>
    </>
  );
}
