# Flowly

App web para organizar **hábitos, rutinas, tareas, eventos y notas** en un solo lugar.

> [!NOTE]
> Puedes visualizar una version de este proyecto en [flowly-habits](https://flowly-habits.vercel.app/).

## Stack

- **Next.js 16** (App Router) · **TypeScript** (estricto) · **SCSS** (un `.scss` por componente)
- **next-intl** — ruteo por locale bajo `src/app/[locale]/` · **español e inglés** (es = `/`, en = `/en/`) con switcher en el sidebar
- **Firebase** — Auth con Google + Firestore (datos en tiempo real con `onSnapshot`)
- **@dnd-kit** — drag & drop (tareas y bloques de contenido)
- **MUI Icons** — iconografía
- **PWA** — manifest + íconos generados (instalable en mobile)
- **Service Worker + Web Audio** — notificaciones del sistema y sonido

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
- **Pausar/reanudar** (modo vacaciones): los días pausados no rompen la racha ni cuentan como programados; la rutina se ve gris en "Para hoy" con el botón de reanudar resaltado como única acción.

### Pendientes
- Listas con color, tareas con estado, fecha límite, etiquetas, subtareas y favoritos; drag & drop para reordenar (desde el asa, que en mobile va a la derecha).
- **Descripciones enriquecidas por bloques** (mismo editor que las notas).
- El detalle se muestra expandido con recorte a 6 líneas ("…" + **Ver más/Ver menos**); los checklists de la descripción se marcan directo desde la lista.
- Filtros por estado, buscador (título + contenido), historial de completadas, crear lista inline desde el form de tarea y edición de la lista activa.

### Eventos
- Calendario con vistas **día / semana / mes / año**; la semana en mobile scrollea horizontal.
- Eventos con color, **icono**, lugar, recordatorios y **recurrencia** (diaria, semanal, mensual, anual, días hábiles) con edición/borrado por ocurrencia o serie completa.
- Detección de conflictos de horario e **import/export con Google Calendar**.

### Notas
- Grid estilo masonry con **notas fijadas**, color de acento e **icono** por nota, búsqueda por título y contenido, duplicar y eliminar.
- Editor de bloques (ver abajo).

### Editor de bloques (notas + descripciones de tareas)
- Tipos de bloque: texto, título, subtítulo, lista, lista numerada, checklist, cita y separador; reordenables por drag & drop desde el asa.
- **Formato inline**: **negrita** (`**texto**`, Ctrl+B), _itálica_ (`_texto_`, Ctrl+I) y ~~tachado~~ (`~~texto~~`), combinables y anidables; las URLs se vuelven links clicables (sin romper URLs con guiones bajos).
- **Atajos markdown** al escribir: `# `, `## `, `- `, `1. `, `[] `, `> `.
- **Convertir el tipo** del bloque enfocado desde la barra de formato (texto ↔ lista, etc.) sin borrarlo.
- Barra de formato **sticky** al fondo del editor de notas + botón **"Agregar texto"**.
- Acciones por bloque en un **menú de 3 puntitos** (copiar / cortar / eliminar).
- En la vista de solo lectura: checklists marcables desde la card con contador de progreso.

### Pomodoro
- Timer con presets + configuración personalizada, asociable a una tarea o rutina; estadísticas de tiempo de enfoque; aviso (con sonido) al terminar cada bloque.

### Notificaciones
- **Avisos del sistema + sonido + toast in-app** mientras Flowly está abierto (aunque sea en otra pestaña).
- Recordatorios de **eventos** (X minutos antes), **rutinas** (a su hora de inicio; ignora pausadas/ya marcadas) y **tareas** (que vencen hoy).
- Vía **Service Worker** (`registration.showNotification`, fiable en desktop y Android) con fallback; sonido generado con **Web Audio** y **duración configurable** (corto / mediano / largo).
- **Botón "Probar notificación"** en Ajustes y de-duplicación persistida (no repite el mismo aviso).
- *Limitación conocida:* push con la app cerrada requiere infraestructura externa (Web Push + cron, o un wrap nativo) y aún no está implementado.

### Dashboard
- Saludo con reloj en vivo, accesos rápidos, resumen del día (rutinas y tareas de hoy interactivas; las rutinas pausadas no cuentan como pendientes), próximo evento y tiempo de enfoque.

### General
- **Tema claro/oscuro/sistema** sin parpadeo (cookie renderizada en el servidor).
- **i18n completo** es/en, fechas y horas localizadas con `Intl`.
- **Selector de hora propio** (`TimeField`) para rutinas y eventos: se ve igual en todos los dispositivos, no se corta en mobile, permite cualquier minuto y al elegir el inicio propone fin = inicio + 1 h.
- Skeleton loaders por página, layout responsive (sidebar → drawer en mobile) y botón para sembrar datos de ejemplo.

## Modelo de datos (Firestore)

Todo cuelga del usuario autenticado (las reglas impiden el acceso cruzado):

```
users/{uid}                       # perfil + settings (theme, timezone, notifications, soundDuration)
users/{uid}/routines/{id}         # rutinas (active + pauses para el modo vacaciones)
users/{uid}/routineLogs/{id}      # estado por día  (id = `${routineId}_${YYYY-MM-DD}`)
users/{uid}/lists/{id}            # listas de pendientes
users/{uid}/tasks/{id}            # tareas (subtareas + descriptionBlocks embebidos)
users/{uid}/events/{id}           # eventos (con icon, recurrencia y excludedDates)
users/{uid}/notes/{id}            # notas (icon + contenido por bloques)
users/{uid}/pomodoroSessions/{id} # bloques de enfoque completados
```

## Estructura

```
public/                 # sw.js (service worker de notificaciones), íconos
src/
├─ app/[locale]/        # rutas: dashboard (/), routines, todo, events, notes, pomodoro, settings
├─ components/
│  ├─ ui/               # kit reutilizable (Button, Modal, Field+TimeField, Select,
│  │                    #   ActionMenu, MiniCalendar, IconPicker, ColorPicker, ...)
│  ├─ blocks/           # BlockEditor (editable) + BlockContent (render con formato/links)
│  ├─ layout/           # Sidebar, Brand, LanguageSwitcher
│  ├─ auth/LoginGate/
│  ├─ routines/         # DaySelector, RoutineForm, RoutineCard, RoutineStats
│  ├─ todo/             # ListSidebar, TaskItem, TaskForm, ListForm
│  ├─ events/           # EventForm, TimeGrid, MonthView, YearView
│  ├─ notes/            # NoteCard, NoteEditor
│  ├─ notifications/    # Reminders (motor de avisos con la app abierta)
│  ├─ pomodoro/         # PomodoroTimer, PomodoroSettings
│  ├─ dashboard/        # StatCard, NextEventCard, Clock
│  └─ skeletons/        # loaders por página
├─ contexts/            # Auth, Settings, Routines, Todo, Events, Notes, Pomodoro
├─ services/            # capa de acceso a Firestore (+ googleCalendar, seed)
├─ utils/               # dates, blocks, reminders, notify, routineStats, events, icons, ...
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
