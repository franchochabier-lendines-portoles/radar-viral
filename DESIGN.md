# Sistema visual: el radar como mapa térmico

La viralidad se lee como temperatura. Todo lo que quema usa una única rampa de color; todo lo demás es tinta sobre papel frío, para que el calor sea lo único que llama la atención.

## Color

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#E9EDF1` | Fondo de la página (gris azulado frío) |
| `surface` | `#F8FAFC` | Paneles |
| `ink` | `#18203A` | Texto principal, botón principal, historia más caliente |
| `muted` / `faint` | `#586179` / `#7D8699` | Texto secundario |
| `rule` | `#D3D9E1` | Separadores |
| `cold` | `#DDE2E8` | Celda u hora sin datos |
| `heat-0…5` | `#EDE4EA` → `#6F0C34` | Rampa secuencial magenta (umbrales 15, 30, 45, 60, 75). Texto blanco desde `heat-4` |

La rampa está duplicada a propósito en `app/globals.css` y `lib/heat.ts` (el correo necesita los valores en línea). Si cambias una, cambia la otra.

## Tipografía

- **Bricolage Grotesque** para la interfaz y las cifras (con números tabulares).
- **Newsreader** solo para titulares de noticias: separa lo que se lee de lo que se usa.

## Piezas

- **Mapa de calor** (país × tema): la pieza memorable y a la vez el filtro principal. Al cargar, las celdas se calientan en cascada una sola vez (desactivado con movimiento reducido).
- **Historia más caliente:** el único bloque en tinta oscura; explica de dónde salen sus puntos.
- **Tira térmica:** 24 casillas por historia, una por hora, con el índice máximo de esa hora.
- **Radios:** 10 px en paneles, 4 px en celdas y cifras.
