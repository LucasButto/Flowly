import { defineRouting } from "next-intl/routing";

// Por ahora solo español. Para sumar inglés: agregar "en" a `locales`,
// traducir `messages/en.json` y montar el <LanguageSwitcher/>.
export const routing = defineRouting({
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});
