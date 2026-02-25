# Catálogo MuscleWiki Offline + Filtros Combinados (Static Repo)

## Resumen
Objetivo: reemplazar catálogo manual actual por catálogo generado desde MuscleWiki (ingesta one-shot), guardado 100% estático en el repo (sin llamadas API en runtime), con assets locales (2 visuales por ejercicio + 1 txt de pasos) y UI con 4 filtros combinables:

1. grupo (`push/pull/piernas/core/movilidad`)
2. músculo
3. equipo
4. dificultad

Decisiones ya fijadas:
- fuente: `api.musclewiki.com` (ingesta local)
- modo deploy: estático puro (sin API en frontend)
- stack: `Vite + vanilla JS`
- media por ejercicio: `male front + side`
- formato media local: `MP4/WebM + poster` (autoloop en UI)
- clasificación grupo: tabla `músculo -> grupo` (force solo apoyo / fallback)
- scope equipos: `Bodyweight,Kettlebells,Stretches,Band,TRX,Yoga,Cardio,Recovery`

## Nota legal / source compliance
Tu decisión: “tengo permiso escrito” para bulk local.

Plan incluye:
- dejar un archivo de trazabilidad (`docs/data-source-musclewiki.md`) con:
  - fecha de ingesta
  - endpoints usados
  - alcance (equipos/músculos/dificultades)
  - nota de permiso escrito (sin exponer contenido sensible)
- no usar API en producción/runtime (solo ingest local)

## Arquitectura propuesta (repo)
Estructura final (objetivo):

```text
index.html                      # shell de app (o redirect al build si se elige)
vite.config.js
package.json
src/
  main.js
  styles.css
  data/
    exercises.manifest.json     # catálogo generado
    taxonomies.json             # listas normalizadas filtros/labels
  lib/
    filters.js
    renderGrid.js
    renderLightbox.js
    taxonomy.js
    media.js
scripts/
  musclewiki-sync.mjs           # ingesta principal (API -> assets + manifest)
  normalize-media.mjs           # transcode/optimize (si se separa)
  validate-manifest.mjs
data/
  raw/
    musclewiki/                 # respuestas API crudas (opcional, debug)
  exercises/
    <exercise-slug>/
      meta.json
      steps.txt
      poster-front.jpg
      poster-side.jpg
      front.webm
      front.mp4
      side.webm
      side.mp4
docs/
  data-source-musclewiki.md
```

Si querés mantener repo ultra simple, `Vite` puede compilar a `/dist` y luego copiar `dist/*` al root; pero plan recomendado: mantener fuente en `src/` y publicar `dist/` (GH Pages o similar).

## Flujo de ingesta (one-shot local, no runtime API)
### 1) Descubrir catálogo y filtrar
Script `scripts/musclewiki-sync.mjs`:
- llama endpoint lista (`/exercises`)
- filtra por `Equipment` en set permitido:
  - `Bodyweight`
  - `Kettlebells`
  - `Stretches`
  - `Band`
  - `TRX`
  - `Yoga`
  - `Cardio`
  - `Recovery`
- incluye todos los músculos y todas las dificultades
- excluye ejercicios sin identificador usable o sin media front/side male

### 2) Enriquecer por ejercicio
Para cada ejercicio:
- obtener detalle (`/exercises/{id}`) para metadata + instrucciones/pasos
- obtener media male front/side (endpoints `images`/`videos` según disponibilidad)
- seleccionar exactamente 2 ángulos:
  - `male/front`
  - `male/side`
- guardar pasos en `steps.txt` (un archivo por ejercicio)

### 3) Normalizar media local (web-friendly autoloop)
Regla:
- si hay video fuente:
  - descargar video
  - generar `webm` + `mp4` optimizados (loop/muted/autoplay-friendly)
  - generar `poster` jpg/webp
- si solo hay imagen:
  - guardar imagen como poster
  - no forzar fake video
  - UI renderiza `<img>` en loop slot (sin autoplay)
- si hay gif:
  - convertir a `webm/mp4` y poster
  - opcional conservar original solo debug (`data/raw`), no usar en UI

Formato recomendado UI:
- `video` con `autoplay muted loop playsinline preload="metadata"` + `poster`
- `source` order: `webm` luego `mp4`

### 4) Generar manifest estático
Salida `src/data/exercises.manifest.json` con todo lo necesario para UI offline.
Incluye paths relativos locales, labels de filtros, y pasos path.

## Schema / interfaces públicas (decisión-complete)
### `src/data/exercises.manifest.json`
```json
{
  "generatedAt": "2026-02-25T00:00:00Z",
  "source": {
    "provider": "MuscleWiki",
    "mode": "offline-generated"
  },
  "filters": {
    "groups": ["todos", "push", "pull", "piernas", "core", "movilidad"],
    "muscles": ["todos", "..."],
    "equipment": ["todos", "Bodyweight", "Band", "..."],
    "difficulties": ["todos", "Beginner", "Intermediate", "Advanced"]
  },
  "exercises": [
    {
      "id": "Barbell-Bench-Press-Flat",
      "slug": "pectorals-bodyweight-beginner-push-push-up",
      "name": "Push-up",
      "muscle": "Pectorals",
      "musclesSecondary": ["Triceps", "Shoulders"],
      "equipment": "Bodyweight",
      "difficulty": "Beginner",
      "group": "push",
      "angles": ["front", "side"],
      "media": {
        "front": {
          "type": "video",
          "webm": "data/exercises/pectorals-bodyweight-beginner-push-push-up/front.webm",
          "mp4": "data/exercises/pectorals-bodyweight-beginner-push-push-up/front.mp4",
          "poster": "data/exercises/pectorals-bodyweight-beginner-push-push-up/poster-front.jpg"
        },
        "side": {
          "type": "video",
          "webm": "...",
          "mp4": "...",
          "poster": "..."
        }
      },
      "stepsPath": "data/exercises/pectorals-bodyweight-beginner-push-push-up/steps.txt",
      "tags": ["bodyweight", "push", "pectorals", "beginner"]
    }
  ]
}
```

### `steps.txt` format (uno por ejercicio)
Plain text UTF-8:
```txt
Name: Push-up
Muscle: Pectorals
Equipment: Bodyweight
Difficulty: Beginner
Group: push
Source ID: <api id>
Source: MuscleWiki (ingested YYYY-MM-DD)

1. ...
2. ...
3. ...
```

### File naming rule (tu requisito)
Todos los assets y folder names deben contener:
- `musculo`
- `equipo`
- `dificultad`
- `grupo` (`push/pull/piernas/core/movilidad`)
- más nombre del ejercicio para unicidad

Slug canonical:
`<muscle>-<equipment>-<difficulty>-<group>-<exercise-name>`

Archivos:
- `.../front.webm`
- `.../front.mp4`
- `.../poster-front.jpg`
- `.../side.webm`
- `.../side.mp4`
- `.../poster-side.jpg`
- `.../steps.txt`

## Clasificación `group` (push/pull/piernas/core/movilidad)
Regla principal: `músculo -> group`.

### Tabla base (ejemplo; implementada explícita en `taxonomy.js`)
- `Pectorals`, `Triceps`, `Shoulders (anterior/lateral)` -> `push`
- `Lats`, `Upper Back`, `Biceps`, `Forearms`, `Rear Delts` -> `pull`
- `Quads`, `Hamstrings`, `Glutes`, `Calves`, `Adductors`, `Abductors` -> `piernas`
- `Abs`, `Obliques`, `Lower Back` -> `core`
- `Neck`, `Mobility`, `Stretch`, `Recovery`, yoga/stretch-oriented groups -> `movilidad`

Fallbacks:
- si `equipment` in `Yoga|Stretches|Recovery` y músculo ambiguo -> `movilidad`
- si API expone `Force=Push/Pull`, usar solo para desempate de torso
- `Cardio`:
  - si músculo principal de piernas -> `piernas`
  - si tronco/core dominante -> `core`
  - si movilidad/recovery style -> `movilidad`

Overrides manuales:
- archivo `src/data/group-overrides.json` (opcional pero recomendado)
- clave por `exercise id`, valor `group`
- se aplica al final del pipeline

## UI / Frontend (Vite + vanilla JS)
### Layout
Mantener look actual (grid + lightbox), pero modular.
Añadir barra de filtros sticky con 4 controles simultáneos:
- `Grupo`
- `Músculo`
- `Equipo`
- `Dificultad`

Cada filtro:
- opción inicial `Todos`
- selección única (no multiselect)
- combinables por intersección

### Estado de filtros
Modelo:
```js
{
  group: 'todos',
  muscle: 'todos',
  equipment: 'todos',
  difficulty: 'todos'
}
```

Lógica:
- `visible = exercises.filter(matchesAllSelectedFilters)`
- paginación/infinite scroll aplicada sobre `visible`
- cambiar cualquier filtro:
  - reset page
  - cerrar lightbox si item ya no visible (o remapear índice)
  - rerender grid
  - actualizar contador

### Grid item
Cada card muestra:
- visual principal (`front`) autoplay loop
- nombre
- chips metadata (músculo, equipo, dificultad, grupo) o parte de ellos
- fallback poster si video falla

### Lightbox
Muestra:
- toggle front/side (tabs o botones)
- video/image grande
- metadata completa
- pasos:
  - cargar `steps.txt` on-demand (`fetch` local)
  - cache en memoria después del primer open

### Performance
- lazy load videos con `IntersectionObserver`
- `preload="none"` en grid, `metadata` en lightbox
- poster primero, video swap al entrar viewport
- optional virtualized-ish page chunks (seguir `PAGE_SIZE`)
- manifest único JSON (gzip-friendly)

## Pipeline / tooling (implementación)
### Dependencias recomendadas
- runtime app: ninguna pesada (vanilla)
- build: `vite`
- ingest:
  - Node 20+
  - `undici` o `node-fetch` (si no usar native fetch)
  - `fs-extra` (opcional)
  - `p-limit` (rate limit)
  - `slugify`
  - `zod` (schema validation API responses, recomendado)
- media:
  - `ffmpeg` + `ffprobe` (CLI prerequisite)
  - script invoca CLI, no librería pesada

### `musclewiki-sync.mjs` flags (CLI)
Definir CLI clara:
```bash
node scripts/musclewiki-sync.mjs \
  --api-key <KEY> \
  --equipment Bodyweight,Kettlebells,Stretches,Band,TRX,Yoga,Cardio,Recovery \
  --gender male \
  --angles front,side \
  --out data/exercises \
  --manifest src/data/exercises.manifest.json \
  --concurrency 4
```

Opciones:
- `--dry-run` (solo lista y stats)
- `--limit N` (pruebas)
- `--skip-media` (solo metadata/txt)
- `--resume` (salta ya descargados)
- `--rebuild-manifest-only`

### Reglas de robustez
- retries con backoff en HTTP (3 intentos)
- throttle/concurrency bajo (4-6)
- logs por ejercicio con error exacto
- continuar si falla un ejercicio; resumen final `ok/failed/skipped`
- guardar `failures.json` para retry targeted

## Reemplazo de actuales / limpieza de no usados
Plan de migración:
1. mover assets actuales legacy a backup temporal (durante implementación)
2. generar nuevo catálogo y manifest
3. UI pasa a leer manifest (no `const EXERCISES` hardcodeado)
4. eliminar gifs legacy y código inline viejo
5. dejar solo nueva app + assets generados

Resultado esperado:
- catálogo actual manual desaparece
- no quedan refs a gifs viejos no usados
- todo servido desde archivos locales generados

## Tests / validaciones (aceptación)
### Ingest pipeline
1. `dry-run` devuelve conteo por equipo/músculo/dificultad y total candidatos
2. `limit 5` genera exactamente:
   - 5 carpetas ejercicio
   - 5 `steps.txt`
   - hasta 10 sets de media (2 ángulos por ejercicio; con fallback image permitido)
   - manifest válido con 5 entries
3. `resume` no redescarga assets existentes
4. `validate-manifest` falla si:
   - falta `steps.txt`
   - path media roto
   - `group` fuera de enum
   - filtro contiene valor no presente en entries

### Frontend UI
1. carga manifest local y renderiza grid inicial
2. filtros muestran opción `Todos` + valores reales (deduplicados, ordenados)
3. combinación filtros (ej: `push + Pectorals + Bodyweight + Beginner`) reduce por intersección
4. reset individual a `Todos` reexpande resultados
5. lightbox abre y alterna front/side
6. pasos se muestran desde `steps.txt`
7. `no results` aparece cuando combinación vacía
8. mobile: filtros + grid + lightbox navegables
9. fallback poster si video no carga

### Build/deploy
- `npm run build` genera sitio estático sin referencias remotas a MuscleWiki
- abrir `dist` local: funciona offline (excepto si browser bloquea file:// fetch; usar `vite preview`/server)
- no secretos/API keys dentro de `src/`, `dist/`, o repo tracked files

## Comandos previstos (implementación)
- `npm install`
- `npm run sync -- --api-key ...` (one-shot ingest local)
- `npm run validate:data`
- `npm run build`
- `npm run preview`

## Supuestos y defaults explícitos
- tenés permiso escrito para bulk ingest + almacenamiento local (fuera de términos estándar)
- API key se usa solo localmente en script de ingesta; no se publica
- variante media elegida: `male` + ángulos `front`,`side`
- si falta video, se acepta imagen local (`poster`) para ese ángulo
- `steps.txt` se genera en inglés (texto fuente API), UI puede quedar en español
- `Vite + vanilla JS` reemplaza `index.html` inline actual
- grupo `movilidad` incluye `Stretches/Yoga/Recovery` y músculos de movilidad/ambiguos según tabla + overrides

## Riesgos / puntos a vigilar
- volumen repo grande (videos) -> considerar Git LFS si explota tamaño
- inconsistencia de schema API (campos/labels distintos) -> normalizador con `zod` + mapeos
- ffmpeg no instalado -> fallback “mixto automático” temporal (guardar fuente y render adaptativo)
- ejercicios sin front/side male -> `skip` con log y reporte final

## Entregables finales (cuando se implemente)
- nueva app Vite estática con 4 filtros combinables
- script de ingesta reproducible
- dataset local generado (`media + steps + manifest`)
- validadores + docs de fuente/permiso
- limpieza de assets/código legacy no usados

## Next Step (Post-UI)
- Fix crawler step extraction: parse embedded Next.js payload (`correct_steps`) reliably for most exercises (current dataset has many `No instructions parsed from page`).
- Regenerate `steps.txt` with `--resume --skip-media` after parser fix.
