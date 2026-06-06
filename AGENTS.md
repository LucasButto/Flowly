<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Flowly

App web de gestión de hábitos, rutinas, tareas y eventos.

- **Stack:** Next.js 16 (App Router) · TypeScript estricto · SCSS (un `.scss` por componente) · next-intl · Firebase Auth (Google) + Firestore.
- **i18n:** todo bajo `src/app/[locale]/`. Por ahora solo `es`.
- **Tema:** claro/oscuro vía CSS custom properties en `src/styles/_theme.scss` (`[data-theme]`). No usar colores hardcodeados en componentes: usar `var(--...)`.
- **Datos:** subcolecciones por usuario en Firestore: `users/{uid}/routines`, `routineLogs`, `lists`, `tasks`, etc. La config del usuario vive en el doc `users/{uid}`.
- **Convención:** cada componente en su carpeta con su `.scss` co-ubicado.
