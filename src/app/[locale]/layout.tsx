import "@/styles/globals.scss";
import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { RoutinesProvider } from "@/contexts/RoutinesContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { ToastProvider } from "@/components/ui/Toast/ToastProvider";
import LoginGate from "@/components/auth/LoginGate/LoginGate";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Flowly",
    template: "%s · Flowly",
  },
  description:
    "Organizá tus hábitos, rutinas, tareas y eventos en un solo lugar.",
  applicationName: "Flowly",
  appleWebApp: { capable: true, title: "Flowly" },
};

export const viewport: Viewport = {
  themeColor: "#0e1014",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  // Tema renderizado en el server desde cookie → sin flash y sin <script> en JSX
  const cookieStore = await cookies();
  const theme = cookieStore.get("flowly_theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <AuthProvider>
              <SettingsProvider>
                <RoutinesProvider>
                  <TodoProvider>
                    <EventsProvider>
                      <PomodoroProvider>
                        <LoginGate>{children}</LoginGate>
                      </PomodoroProvider>
                    </EventsProvider>
                  </TodoProvider>
                </RoutinesProvider>
              </SettingsProvider>
            </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
