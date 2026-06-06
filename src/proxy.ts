import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// next-intl maneja el ruteo por locale. La protección de rutas se resuelve
// del lado del cliente con <LoginGate>, y la seguridad real de los datos vive
// en las Firestore Security Rules.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
