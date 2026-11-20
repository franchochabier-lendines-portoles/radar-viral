# Radar viral 2.3

Dashboard en tiempo real y correo periódico con las noticias más virales **ahora mismo** en España, Inglaterra, Francia y Estados Unidos, en seis temas (Internacional, Curiosidades, Jardinería, Eventos, Economía y Novedades). **Nunca** muestra ni envía noticias de política ni de deportes.

Cada noticia indica qué medio la firma, cuál la publicó primero y qué otros medios la cuentan (con enlace a cada uno). Para España hay un desglose por medio: El Español, El Mundo, El País, OKDIARIO, ABC, La Razón, El Confidencial, 20 Minutos, El Periódico, La Vanguardia y Otros.

## Publicado en internet (gratis)

- **Web:** Vercel, desplegada desde este repositorio. Cada `git push` a `main` la actualiza sola.
- **Base de datos:** Turso (SQLite en la nube). Variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Sin ellas, la app usa el archivo local `data/radar.db`, como antes.
- **Lecturas:** al abrir el radar, si los datos tienen más de 10 minutos (`STALE_AFTER_MINUTES`), se lanza una lectura en segundo plano. Además, `.github/workflows/radar.yml` lee cada hora y prepara el correo a las 9, 14 y 20 h (Madrid). Sus variables van en *Settings → Secrets and variables → Actions*.
- **Solo lectura:** con `PUBLIC_READONLY=1` la web pública no muestra los botones de Actualizar ni de Enviar correo.
- **Correo real:** añade los secretos `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` y `MAIL_TO` en GitHub. Sin ellos, el correo se guarda en la base y se ve en "Ver el último correo".

## Línea editorial

Por defecto el radar solo recomienda noticias virales sobre los mismos **temas generales** de una línea de contenidos de servicio y curiosidades. Busca noticias de cualquier medio sobre esos temas.

Los temas: casa y trucos de limpieza, Hacienda/pensiones/herencias, consumo y supermercados, cocina y trucos de chef, psicología y longevidad, salud práctica, mascotas, el tiempo (AEMET), festivos y calendario, frases y reflexiones, testimonios y curiosidades, y motor/DGT.

- El perfil está en `lib/profile.ts`: cada tema tiene sus palabras clave en español, inglés y francés, el topic del radar en el que encaja y una búsqueda de Google News que trae ese tipo de noticias. Para ajustarlo basta con editar esa lista.
- Cada historia guarda los temas en los que encaja. El dashboard abre en **Línea editorial** y se puede cambiar a **Todo lo viral** (`/?ver=todo`). Los botones de tema filtran (`/?linea=mascotas`).
- El correo solo incluye historias de la línea.
- Las noticias de Hacienda, pensiones o multas ya no se descartan como política cuando son de finanzas personales. Si mencionan partidos, elecciones o políticos se siguen excluyendo.

## Arrancar

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

## Qué cambia respecto a la 1.0

- **Diseño nuevo** basado en la temperatura (ver `DESIGN.md`): un mapa de calor país × tema es la pieza central y sirve de filtro; la historia más caliente se abre con el porqué de su índice; cada noticia lleva una tira térmica de 24 h en lugar de un sparkline.
- **Filtros en la URL** (`/?pais=es&tema=economia`): se pueden compartir y guardar.
- **Código reescrito** con TypeScript estricto (`noUncheckedIndexedAccess`), validación con zod en las fronteras (RSS y base de datos), funciones flecha y exports con nombre, Tailwind v4 con tokens semánticos.
- **Historias estables entre ingestas:** una historia conserva su id aunque cambie el titular principal, así su historial no se rompe.
- **Limpieza automática:** se borra lo que tenga más de 48 h.

## Datos

- **Noticias:** RSS de Google News por país. Internacional, Economía y Novedades salen de las secciones WORLD, BUSINESS, TECHNOLOGY y SCIENCE; Curiosidades, Jardinería y Eventos, de búsquedas de las últimas 24 h con exclusiones. Las secciones NATION y SPORTS no se leen nunca. Catálogo en `lib/sources/feeds.ts`.
- **Medios de España:** se lee lo último de cada medio del catálogo (`site:dominio`). Sirve para saber quién cuenta cada historia; solo entran solas en el ranking si su tema es inequívoco. Para añadir un medio, una línea en `ES_OUTLETS` de `lib/config.ts`.
- **Tendencias:** Google Trends por país, con volumen aproximado.
- **Inglaterra:** Google News no separa Inglaterra del resto de Reino Unido; se usa la edición GB.
- **Demo:** `npm run seed` carga titulares inventados (`scripts/demo-data.ts`), incluidos algunos de política y deportes para ver el filtro en acción. En España se reparten al azar entre medios reales del catálogo: ni los titulares ni las cifras son de esos medios. Dashboard y correo lo marcan como datos de demo.

## Cómo está hecho

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
