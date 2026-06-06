# Flowly

App web para organizar **hábitos, rutinas, tareas y eventos** en un solo lugar.

> Tu día, en flow.

## Stack

- **Next.js 16** (App Router) · **TypeScript** (estricto) · **SCSS** (un `.scss` por componente)
- **next-intl** — ruteo por locale bajo `src/app/[locale]/` (por ahora solo `es`)
- **Firebase** — Auth con Google + Firestore
- **@dnd-kit** — drag & drop de tareas
- **MUI Icons** — iconografía

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` a partir del ejemplo y completar con tu proyecto de Firebase
   (Firebase Console → Configuración del proyecto → Tus apps → SDK):

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. En la consola de Firebase:
   - **Authentication** → habilitar el proveedor **Google**.
   - **Firestore Database** → crear la base y publicar las reglas de [`firestore.rules`](firestore.rules).
   - **Authentication → Settings → Authorized domains** → agregar `localhost`.

4. Levantar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000

## Modelo de datos (Firestore)

Todo cuelga del usuario autenticado (las reglas impiden el acceso cruzado):

```
users/{uid}                      # perfil + settings (theme, timezone, notifications)
users/{uid}/routines/{id}        # rutinas
users/{uid}/routineLogs/{id}     # estado por día  (id = `${routineId}_${YYYY-MM-DD}`)
users/{uid}/lists/{id}           # listas de pendientes
users/{uid}/tasks/{id}           # tareas (subtareas embebidas)
users/{uid}/events/{id}          # eventos (con recurrencia)
users/{uid}/pomodoroSessions/{id} # bloques de enfoque completados
```

## Estructura

```
src/
├─ app/[locale]/        # rutas: dashboard (/), routines, todo, events, pomodoro, settings
├─ components/
│  ├─ ui/               # kit reutilizable (Button, Modal, Field, Switch, ...)
│  ├─ layout/           # Sidebar, Brand, ThemeScript
│  ├─ auth/LoginGate/
│  ├─ routines/         # DaySelector, RoutineForm, RoutineCard, RoutineStats
│  ├─ todo/             # ListSidebar, TaskItem, TaskForm, ListForm
│  └─ dashboard/        # StatCard
├─ contexts/            # Auth, Settings, Routines, Todo
├─ services/            # capa de acceso a Firestore
├─ utils/               # dates, format, routineStats, colors, ids
├─ types/               # tipos de dominio
├─ i18n/ · navigation.ts · proxy.ts
└─ styles/              # _variables, _theme (claro/oscuro), globals
```

## Estado del MVP

| Sección | Estado |
|---|---|
| Auth (Google), perfil, sesión persistente | ✅ |
| Tema claro/oscuro/sistema, zona horaria, notificaciones | ✅ |
| **Rutinas** — CRUD, frecuencia, detección de superposición, estados, rachas, estadísticas (día/semana/mes/año) | ✅ |
| **Pendientes** — listas, tareas, estados, prioridad, fecha límite, etiquetas, subtareas, drag & drop, filtros, buscador, favoritos, historial | ✅ |
| **Eventos** — calendario día/semana/mes, eventos recurrentes, detección de conflictos, recordatorios | ✅ |
| **Pomodoro** — timer con presets + config personalizada, estadísticas, asociar a tarea/rutina | ✅ |
| Dashboard — resumen diario y semanal (eventos próximos + tiempo de enfoque incluidos) | ✅ |

## Tema

Los colores se definen como **CSS custom properties** en `src/styles/_theme.scss`
(`[data-theme="light|dark"]`). Para evitar el parpadeo de tema, el `data-theme`
se renderiza en el servidor leyendo la cookie `flowly_theme` (que
`SettingsContext` mantiene sincronizada con el tema resuelto). En los componentes
usar siempre `var(--...)`, nunca colores hardcodeados.
