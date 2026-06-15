---
name: mui-icon-sizing-specificity
description: Cómo dimensionar iconos de MUI en Flowly sin que los pise el estilo de Emotion
metadata:
  type: project
---

Para fijar tamaño (`width`/`height`) a un icono de `@mui/icons-material`, NO alcanza con poner una clase directa sobre el `<svg>`: empata en especificidad con `.MuiSvgIcon-root` (ambos `0,1,0`) y Emotion inyecta su `<style>` después, así que MUI gana (`width:1em;height:1em;font-size:1.5rem` → ~24px).

**Solución (convención del repo):** escopear la regla de tamaño al padre para subir a `0,2,0`, p. ej. `.parent svg { ... }` o `.parent .icon-class { ... }`. En SCSS BEM: `&__parent &__icon { width; height }`.

El color sí se puede setear por la clase del svg (MUI usa `fill: currentColor` y no fija `color`), o inline (gana siempre). El componente reutilizable es [[flow-icon-component]] (`src/utils/icons.tsx`).
