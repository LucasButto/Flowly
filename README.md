# Flowly

App web para organizar **hábitos, rutinas, tareas, eventos y notas** en un solo lugar.

> Tu día, en flow.

## Stack

- **Next.js 16** (App Router) · **TypeScript** (estricto) · **SCSS** (un `.scss` por componente)
- **next-intl** — ruteo por locale bajo `src/app/[locale]/` · **español e inglés** (es = `/`, en = `/en/`) con switcher en el sidebar
- **Firebase** — Auth con Google + Firestore (datos en tiempo real con `onSnapshot`)
- **@dnd-kit** — drag & drop (tareas y bloques de contenido)
- **MUI Icons** — iconografía
- **PWA** — manifest + íconos generados (instalable en mobile)

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

## Funcionalidades

### Rutinas
- CRUD con frecuencia (diaria, días hábiles, personalizada), horario, color y etiqueta; detección de superposición horaria.
- Vista **"Para hoy"** con navegación por días: flechas ‹ ›, mini-calendario al tocar la fecha y botón "Hoy". Se pueden marcar como completadas/omitidas rutinas de **días pasados o futuros** (p. ej. omitir por adelantado el gym de mañana).
- **Rachas** (actual y mejor), tasa de cumplimiento y estadísticas por día/semana/mes/año con gráficos.
- **Pausar/reanudar** (modo vacaciones): los días pausados no rompen la racha ni cuentan como programados; la rutina se ve gris en "Para hoy" con el botón de reanudar como única acción.

### Pendientes
- Listas con color, tareas con estado, fecha límite, etiquetas, subtareas y favoritos; drag & drop para reordenar.
- **Descripciones enriquecidas por bloques** (mismo editor que las notas): títulos, listas, checklists, citas, links clicables y negrita.
- El detalle se muestra expandido con recorte a 6 líneas ("…" + **Ver más/Ver menos**); los checklists de la descripción se marcan directo desde la lista.
- Filtros por estado, buscador (título + contenido), historial de completadas, crear lista inline desde el form de tarea y edición de la lista activa.

### Eventos
- Calendario con vistas **día / semana / mes / año**; la semana en mobile scrollea horizontal.
- Eventos con color, lugar, recordatorios y **recurrencia** (diaria, semanal, mensual, anual, días hábiles) con edición/borrado por ocurrencia o serie completa.
- Detección de conflictos de horario e **import/export con Google Calendar**.

### Notas
- Grid estilo masonry con **notas fijadas**, color de acento por nota, búsqueda por título y contenido, duplicar y eliminar.
- **Editor de bloques**: texto, título, subtítulo, lista, lista numerada, checklist, cita y separador; reordenables por drag & drop.
- Atajos tipo markdown al escribir (`# `, `## `, `- `, `1. `, `[] `, `> `) y **negrita** con `**texto**`, botón B o Ctrl+B — funciona en cualquier tipo de bloque.
- URLs auto-convertidas en links clicables; checklists marcables desde la card con contador de progreso.

### Pomodoro
- Timer con presets + configuración personalizada, asociable a una tarea o rutina; estadísticas de tiempo de enfoque.

### Dashboard
- Saludo con reloj en vivo, accesos rápidos, resumen del día (rutinas y tareas de hoy interactivas), próximo evento y tiempo de enfoque.

### General
- **Tema claro/oscuro/sistema** sin parpadeo (cookie renderizada en el servidor).
- **i18n completo** es/en, fechas localizadas con `Intl`.
- Skeleton loaders por página, layout responsive (sidebar → drawer en mobile) y botón para sembrar datos de ejemplo.

## Modelo de datos (Firestore)

Todo cuelga del usuario autenticado (las reglas impiden el acceso cruzado):

```
users/{uid}                       # perfil + settings (theme, timezone, notifications)
users/{uid}/routines/{id}         # rutinas (active + pauses para el modo vacaciones)
users/{uid}/routineLogs/{id}      # estado por día  (id = `${routineId}_${YYYY-MM-DD}`)
users/{uid}/lists/{id}            # listas de pendientes
users/{uid}/tasks/{id}            # tareas (subtareas + descriptionBlocks embebidos)
users/{uid}/events/{id}           # eventos (con recurrencia y excludedDates)
users/{uid}/notes/{id}            # notas (contenido por bloques)
users/{uid}/pomodoroSessions/{id} # bloques de enfoque completados
```

## Estructura

```
src/
├─ app/[locale]/        # rutas: dashboard (/), routines, todo, events, notes, pomodoro, settings
├─ components/
│  ├─ ui/               # kit reutilizable (Button, Modal, Field, Select, MiniCalendar, ...)
│  ├─ blocks/           # BlockEditor (editable) + BlockContent (render con links/negrita)
│  ├─ layout/           # Sidebar, Brand, LanguageSwitcher
│  ├─ auth/LoginGate/
│  ├─ routines/         # DaySelector, RoutineForm, RoutineCard, RoutineStats
│  ├─ todo/             # ListSidebar, TaskItem, TaskForm, ListForm
│  ├─ events/           # EventForm, TimeGrid, MonthView, YearView, EventReminders
│  ├─ notes/            # NoteCard, NoteEditor
│  ├─ pomodoro/         # PomodoroTimer, PomodoroSettings
│  ├─ dashboard/        # StatCard, NextEventCard, Clock
│  └─ skeletons/        # loaders por página
├─ contexts/            # Auth, Settings, Routines, Todo, Events, Notes, Pomodoro
├─ services/            # capa de acceso a Firestore (+ googleCalendar, seed)
├─ utils/               # dates, blocks, routineStats, events, colors, ids, ...
├─ types/               # tipos de dominio (routine, todo, event, note, blocks, ...)
├─ i18n/ · navigation.ts · proxy.ts
└─ styles/              # _variables, _theme (claro/oscuro), globals
messages/               # es.json · en.json (traducciones)
```

## Tema

Los colores se definen como **CSS custom properties** en `src/styles/_theme.scss`
(`[data-theme="light|dark"]`). Para evitar el parpadeo de tema, el `data-theme`
se renderiza en el servidor leyendo la cookie `flowly_theme` (que
`SettingsContext` mantiene sincronizada con el tema resuelto). En los componentes
usar siempre `var(--...)`, nunca colores hardcodeados.
