"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSettings, type ThemePref } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast/ToastProvider";
import { useRouter } from "@/navigation";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import Switch from "@/components/ui/Switch/Switch";
import Select from "@/components/ui/Field/Select";
import Field from "@/components/ui/Field/Field";
import Button from "@/components/ui/Button/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import SettingsBrightnessRoundedIcon from "@mui/icons-material/SettingsBrightnessRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { seedSampleData } from "@/services/seed";
import "./settings.scss";

function timezoneList(current: string): string[] {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    ).supportedValuesOf?.("timeZone");
    if (supported && supported.length) return supported;
  } catch {}
  const fallback = [
    "UTC",
    "America/Argentina/Buenos_Aires",
    "America/Santiago",
    "America/Mexico_City",
    "America/Bogota",
    "America/Lima",
    "America/New_York",
    "Europe/Madrid",
    "Europe/London",
  ];
  return fallback.includes(current) ? fallback : [current, ...fallback];
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tn = useTranslations("nav");
  const { settings, updateSettings } = useSettings();
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user?.uid) return;
    setSeeding(true);
    try {
      await seedSampleData(user.uid);
      toast(t("seedDone"), "success");
    } catch (err) {
      console.error(err);
      toast(t("seedError"), "error");
    } finally {
      setSeeding(false);
      setSeedOpen(false);
    }
  };

  const timezones = useMemo(
    () => timezoneList(settings.timezone),
    [settings.timezone],
  );

  const themeSegments: { value: ThemePref; label: React.ReactNode }[] = [
    {
      value: "light",
      label: (
        <>
          <LightModeRoundedIcon fontSize="small" /> {t("themeLight")}
        </>
      ),
    },
    {
      value: "dark",
      label: (
        <>
          <DarkModeRoundedIcon fontSize="small" /> {t("themeDark")}
        </>
      ),
    },
    {
      value: "system",
      label: (
        <>
          <SettingsBrightnessRoundedIcon fontSize="small" /> {t("themeSystem")}
        </>
      ),
    },
  ];

  const handleNotifications = async (checked: boolean) => {
    if (checked && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast("Permiso de notificaciones denegado", "error");
        return;
      }
    }
    updateSettings({ notifications: checked });
    toast(t("saved"), "success");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="page settings">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
      </header>

      {/* Perfil */}
      <section className="settings__card">
        <h2 className="section-title">{t("profile")}</h2>
        <div className="settings__profile">
          <span className="settings__avatar">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{user?.displayName?.[0]?.toUpperCase() ?? "U"}</span>
            )}
          </span>
          <div>
            <p className="settings__name">{user?.displayName ?? "Usuario"}</p>
            <p className="settings__email">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Apariencia */}
      <section className="settings__card">
        <h2 className="section-title">{t("appearance")}</h2>
        <Field label={t("theme")}>
          <SegmentedControl
            segments={themeSegments}
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v })}
            fullWidth
          />
        </Field>
      </section>

      {/* Zona horaria */}
      <section className="settings__card">
        <h2 className="section-title">{t("timezone")}</h2>
        <Field hint={t("timezoneHint")}>
          <Select
            value={settings.timezone}
            onChange={(v) => updateSettings({ timezone: v })}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {/* Notificaciones */}
      <section className="settings__card">
        <h2 className="section-title">{t("notifications")}</h2>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">{t("notificationsEnable")}</p>
            <p className="settings__row-hint">{t("notificationsHint")}</p>
          </div>
          <Switch
            checked={settings.notifications}
            onChange={handleNotifications}
            label={t("notificationsEnable")}
          />
        </div>
      </section>

      {/* Datos de ejemplo */}
      <section className="settings__card">
        <h2 className="section-title">{t("data")}</h2>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">{t("loadSample")}</p>
            <p className="settings__row-hint">{t("loadSampleHint")}</p>
          </div>
          <Button
            variant="secondary"
            icon={<AutoAwesomeRoundedIcon />}
            onClick={() => setSeedOpen(true)}
            loading={seeding}
          >
            {t("load")}
          </Button>
        </div>
      </section>

      {/* Cuenta */}
      <section className="settings__card">
        <h2 className="section-title">{t("account")}</h2>
        <Button
          variant="danger"
          icon={<LogoutRoundedIcon />}
          onClick={handleLogout}
        >
          {tn("logout")}
        </Button>
      </section>

      <ConfirmDialog
        open={seedOpen}
        title={t("seedConfirmTitle")}
        description={t("seedConfirmDesc")}
        confirmLabel={t("load")}
        danger={false}
        loading={seeding}
        onConfirm={handleSeed}
        onCancel={() => setSeedOpen(false)}
      />
    </div>
  );
}
