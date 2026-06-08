"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import "./LanguageSwitcher.scss";

const LOCALES = ["es", "en"] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (l: string) => {
    if (l === locale) return;
    router.replace(pathname, { locale: l });
  };

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <LanguageRoundedIcon className="lang-switch__icon" />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-switch__opt ${
            locale === l ? "lang-switch__opt--active" : ""
          }`}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
