# Radar viral 2.3

> 🇪🇸 Versión en español más abajo.

Real-time dashboard and scheduled email digest with the news going viral **right now** in Spain, England, France and the United States, across six topics (World, Curiosities, Gardening, Events, Economy and What's new). It **never** shows or sends politics or sports news.

Each story shows which outlet ran it, which one published it first and which other outlets are covering it (with links). For Spain there is a per-outlet breakdown: El Español, El Mundo, El País, OKDIARIO, ABC, La Razón, El Confidencial, 20 Minutos, El Periódico, La Vanguardia and others.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind v4 · zod · SQLite / Turso · Vitest · GitHub Actions · Vercel.

## Live (free tier)

- **Web:** Vercel, deployed from this repo. Every `git push` to `main` redeploys it.
- **Database:** Turso (cloud SQLite) via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Without them the app uses the local file `data/radar.db`.
- **Refresh:** when the radar is opened and data is older than 10 minutes (`STALE_AFTER_MINUTES`), a background refresh starts. `.github/workflows/radar.yml` also calls the site's `/api/cron` every hour, which refreshes if needed and prepares the email at 9:00, 14:00 and 20:00 (Madrid time). No secrets needed.
- **Read-only:** with `PUBLIC_READONLY=1` the public site hides the Refresh and Send email buttons.
- **Real email:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `MAIL_TO` as Vercel environment variables and redeploy. Without them, the email is stored in the database and shown under "See the last email".

## Editorial profile

By default the radar only recommends viral stories on the general topics covered by a set of writers at a Spanish news outlet. It doesn't look for their articles: it finds stories from any outlet on those topics (home and cleaning tips, taxes/pensions/inheritance, consumer news and supermarkets, cooking, psychology and longevity, practical health, pets, weather, public holidays, quotes, human-interest stories, and motoring).

- The profile lives in `lib/profile.ts`: each topic has keywords in Spanish, English and French, the radar topic it maps to and a Google News query. Editing that list is all it takes to retune it.
- Each story stores the profile topics it matches. The dashboard opens on the profile view and can switch to **Everything viral** (`/?ver=todo`). Topic buttons filter (`/?linea=mascotas`).
- The email only includes stories that match the profile.
- Tax, pension or fine stories are no longer discarded as politics when they're about personal finance; they're still excluded if they mention parties, elections or politicians.

## Getting started

```bash
npm install
npm run seed      # 24 h of DEMO data to try it offline
npm run dev       # http://localhost:3000
```

With real data:

```bash
npm run ingest    # one read of every source (replaces the demo)
npm run worker    # keeps running: ingest every 5 min + email at 9, 14 and 20 h
npm run digest    # send (or simulate) the email now; accepts recipients: npm run digest -- a@b.com
npm test          # exclusion filter, outlets, clustering and scoring
```

In production: `npm run build && npm run start` for the web app and `npm run worker` as a second process (pm2, systemd or your host's service). The dashboard refreshes itself every minute.

**Email.** Copy `.env.example` to `.env.local` and fill in `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `MAIL_TO`. Without SMTP it runs in simulated mode: the email is saved to `data/outbox/` and kept in the history. Preview at `/api/digest/preview`.

**AI filter (optional).** With `ANTHROPIC_API_KEY`, an LLM reviews headlines that already passed the rules and drops politics or sports.

## What changed since 1.0

- **New design** built around temperature (see `DESIGN.md`): a country × topic heat map is the centrepiece and doubles as a filter; the hottest story opens with the reasons behind its score; each story has a 24 h heat strip instead of a sparkline.
- **Filters in the URL** (`/?pais=es&tema=economia`): shareable and bookmarkable.
- **Rewritten code** in strict TypeScript (`noUncheckedIndexedAccess`), zod validation at the boundaries (RSS and database), arrow functions and named exports, Tailwind v4 with semantic tokens.
- **Stable stories across ingests:** a story keeps its id even if its lead headline changes, so its history isn't broken.
- **Automatic cleanup:** anything older than 48 h is deleted.

## Data

- **News:** Google News RSS per country. World, Economy and What's new come from the WORLD, BUSINESS, TECHNOLOGY and SCIENCE sections; Curiosities, Gardening and Events from last-24 h searches with exclusions. NATION and SPORTS are never read. Catalogue in `lib/sources/feeds.ts`.
- **Spanish outlets:** the latest from each outlet in the catalogue (`site:domain`), used to know who is covering each story. Adding an outlet is one line in `ES_OUTLETS` in `lib/config.ts`.
- **Trends:** Google Trends per country, with approximate volume.
- **England:** Google News doesn't separate England from the rest of the UK, so the GB edition is used.
- **Demo:** `npm run seed` loads made-up headlines (`scripts/demo-data.ts`), including some politics and sports to see the filter at work. Dashboard and email flag it as demo data.

## How it's built

| Folder | Contents |
|---|---|
| `app/` | Dashboard (Next.js 15, App Router) and API: `/api/dashboard`, `/api/ingest`, `/api/digest`, `/api/digest/preview` |
| `components/` | Heat map, lead story, list with heat strips, Spanish outlets, trends, emails, action bar |
| `lib/sources/` | Input: what is read (`feeds.ts`) and validated RSS download and parsing (`fetch.ts`) |
| `lib/classify/` | Pure logic: exclusion, topics, clustering, outlets, scoring, `process.ts` (all together) and `llm-guard.ts` |
| `lib/db/` | SQLite (better-sqlite3); the only layer that touches the database |
| `lib/notify/` | Selection, HTML template and sending of the email |
| `lib/profile.ts` | Editorial profile: topics, keywords and queries |
| `lib/dashboard.ts` | Turns the database into what the page renders |
| `lib/pipeline.ts` | One ingest: sources → logic → database; prevents overlapping ingests |
| `scripts/` | `ingest`, `worker`, `send-digest`, `seed` + `demo-data` |
| `tests/` | Vitest |

**Viral score (0–100):** `0.35·coverage + 0.25·trend + 0.25·freshness + 0.15·position`. Freshness halves every 4 h; coverage saturates at 8 outlets. Weights in `SCORE_WEIGHTS` in `lib/config.ts`.

**Exclusion filter:** whole-word rules in Spanish, English and French (`lib/classify/exclusion.ts`), applied on ingest, on display and before sending the email. Government news is only tolerated in Economy if it's pure macro (rates, inflation, tariffs, taxes…) and doesn't mention elections or parties.

**Known limitation.** Google News and Trends don't publish real traffic: the score measures public virality. Real traffic would need an analytics source in `lib/sources/`.

---

<details>
<summary>🇪🇸 Versión en español</summary>

## Radar viral 2.3

Dashboard en tiempo real y correo periódico con las noticias más virales **ahora mismo** en España, Inglaterra, Francia y Estados Unidos, en seis temas (Internacional, Curiosidades, Jardinería, Eventos, Economía y Novedades). **Nunca** muestra ni envía noticias de política ni de deportes.

Cada noticia indica qué medio la firma, cuál la publicó primero y qué otros medios la cuentan (con enlace a cada uno). Para España hay un desglose por medio: El Español, El Mundo, El País, OKDIARIO, ABC, La Razón, El Confidencial, 20 Minutos, El Periódico, La Vanguardia y Otros.

### Publicado en internet (gratis)

- **Web:** Vercel, desplegada desde este repositorio. Cada `git push` a `main` la actualiza sola.
- **Base de datos:** Turso (SQLite en la nube). Variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Sin ellas, la app usa el archivo local `data/radar.db`, como antes.
- **Lecturas:** al abrir el radar, si los datos tienen más de 10 minutos (`STALE_AFTER_MINUTES`), se lanza una lectura en segundo plano. Además, `.github/workflows/radar.yml` llama cada hora a `/api/cron` de la web publicada, que lee si hace falta y prepara el correo a las 9, 14 y 20 h (Madrid). No necesita secretos.
- **Solo lectura:** con `PUBLIC_READONLY=1` la web pública no muestra los botones de Actualizar ni de Enviar correo.
- **Correo real:** añade `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` y `MAIL_TO` como variables de entorno del proyecto en Vercel (*Settings → Environment Variables*) y vuelve a desplegar. Sin ellos, el correo se guarda en la base y se ve en "Ver el último correo".

### Línea editorial

Por defecto el radar solo recomienda noticias virales sobre los mismos **temas generales** de una línea de contenidos de servicio y curiosidades. Busca noticias de cualquier medio sobre esos temas.

Los temas: casa y trucos de limpieza, Hacienda/pensiones/herencias, consumo y supermercados, cocina y trucos de chef, psicología y longevidad, salud práctica, mascotas, el tiempo (AEMET), festivos y calendario, frases y reflexiones, testimonios y curiosidades, y motor/DGT.

- El perfil está en `lib/profile.ts`: cada tema tiene sus palabras clave en español, inglés y francés, el topic del radar en el que encaja y una búsqueda de Google News que trae ese tipo de noticias. Para ajustarlo basta con editar esa lista.
- Cada historia guarda los temas en los que encaja. El dashboard abre en **Línea editorial** y se puede cambiar a **Todo lo viral** (`/?ver=todo`). Los botones de tema filtran (`/?linea=mascotas`).
- El correo solo incluye historias de la línea.
- Las noticias de Hacienda, pensiones o multas ya no se descartan como política cuando son de finanzas personales. Si mencionan partidos, elecciones o políticos se siguen excluyendo.

### Arrancar

```bash
npm install
npm run seed      # 24 h de datos de DEMO para verlo sin conexión
npm run dev       # http://localhost:3000
```

Con datos reales:

```bash
npm run ingest    # una lectura de todas las fuentes (sustituye a la demo)
npm run worker    # se queda en marcha: ingesta cada 5 min + correo a las 9, 14 y 20 h
npm run digest    # envía (o simula) el correo ahora; acepta destinatarios: npm run digest -- a@b.com
npm test          # filtro de exclusión, medios, agrupado y puntuación
```

En producción: `npm run build && npm run start` para la web y `npm run worker` como segundo proceso (pm2, systemd o un servicio de tu hosting). El dashboard se refresca solo cada minuto.

**Correo.** Copia `.env.example` a `.env.local` y rellena `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` y `MAIL_TO`. Sin SMTP funciona en modo simulado: el correo se guarda en `data/outbox/` y queda en el historial. Vista previa en `/api/digest/preview` (enlace “Ver el correo”).

**Filtro con IA (opcional).** Con `ANTHROPIC_API_KEY`, Claude revisa los titulares que ya pasaron las reglas y descarta los de política o deportes.

### Qué cambia respecto a la 1.0

- **Diseño nuevo** basado en la temperatura (ver `DESIGN.md`): un mapa de calor país × tema es la pieza central y sirve de filtro; la historia más caliente se abre con el porqué de su índice; cada noticia lleva una tira térmica de 24 h en lugar de un sparkline.
- **Filtros en la URL** (`/?pais=es&tema=economia`): se pueden compartir y guardar.
- **Código reescrito** con TypeScript estricto (`noUncheckedIndexedAccess`), validación con zod en las fronteras (RSS y base de datos), funciones flecha y exports con nombre, Tailwind v4 con tokens semánticos.
- **Historias estables entre ingestas:** una historia conserva su id aunque cambie el titular principal, así su historial no se rompe.
- **Limpieza automática:** se borra lo que tenga más de 48 h.

### Datos

- **Noticias:** RSS de Google News por país. Internacional, Economía y Novedades salen de las secciones WORLD, BUSINESS, TECHNOLOGY y SCIENCE; Curiosidades, Jardinería y Eventos, de búsquedas de las últimas 24 h con exclusiones. Las secciones NATION y SPORTS no se leen nunca. Catálogo en `lib/sources/feeds.ts`.
- **Medios de España:** se lee lo último de cada medio del catálogo (`site:dominio`). Sirve para saber quién cuenta cada historia; solo entran solas en el ranking si su tema es inequívoco. Para añadir un medio, una línea en `ES_OUTLETS` de `lib/config.ts`.
- **Tendencias:** Google Trends por país, con volumen aproximado.
- **Inglaterra:** Google News no separa Inglaterra del resto de Reino Unido; se usa la edición GB.
- **Demo:** `npm run seed` carga titulares inventados (`scripts/demo-data.ts`), incluidos algunos de política y deportes para ver el filtro en acción. En España se reparten al azar entre medios reales del catálogo: ni los titulares ni las cifras son de esos medios. Dashboard y correo lo marcan como datos de demo.

### Cómo está hecho

| Carpeta | Qué hay |
|---|---|
| `app/` | Dashboard (Next.js 15, App Router) y API: `/api/dashboard`, `/api/ingest`, `/api/digest`, `/api/digest/preview` |
| `components/` | Mapa de calor, historia principal, lista con tiras térmicas, medios de España, tendencias, correos, barra de acciones |
| `lib/sources/` | Entrada: qué se lee (`feeds.ts`) y descarga y parseo RSS validado (`fetch.ts`) |
| `lib/classify/` | Lógica pura: exclusión, temas, agrupado, medios, puntuación, `process.ts` (todo junto) y `llm-guard.ts` |
| `lib/db/` | SQLite (better-sqlite3). Única capa que toca la base de datos |
| `lib/notify/` | Selección, plantilla HTML y envío del correo |
| `lib/profile.ts` | Perfil editorial: temas, palabras clave y búsquedas |
| `lib/dashboard.ts` | Convierte la base de datos en lo que pinta la página |
| `lib/pipeline.ts` | Una ingesta: fuentes → lógica → base de datos. Impide ingestas solapadas |
| `scripts/` | `ingest`, `worker`, `send-digest`, `seed` + `demo-data` |
| `tests/` | Vitest |

**Índice viral (0–100):** `0,35·cobertura + 0,25·tendencia + 0,25·frescura + 0,15·posición`. La frescura se reduce a la mitad cada 4 h; la cobertura se satura con 8 medios. Pesos en `SCORE_WEIGHTS` de `lib/config.ts`.

**Filtro de exclusión:** reglas por palabra completa en español, inglés y francés (`lib/classify/exclusion.ts`), aplicadas al ingerir, al mostrar y antes de enviar el correo. El gobierno solo se tolera en Economía si la noticia es macroeconomía pura (tipos, inflación, aranceles, impuestos…) y no menciona elecciones ni partidos.

**Limitación conocida.** Google News y Trends no publican visitas reales: el índice mide viralidad pública. Para tráfico real habría que conectar una herramienta de analítica en `lib/sources/`.

</details>
