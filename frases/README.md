# Frases motivadoras

Servidor independiente de frases (JSON y fondos de pantalla PNG), sin login. Todas las rutas son públicas y de solo lectura.

```
cd frases
npm install
node server.js            # puerto 3000, o PORT=8080 node server.js
```

| Ruta | Devuelve |
|---|---|
| `GET /frases` | Todas las frases |
| `GET /frases/random` | Una frase al azar |
| `GET /frases/hoy` | Una frase distinta por día (UTC), estable durante el día |
| `GET /frases/:id` | Una frase por id, o 404 |
| `GET /frases/fondo` | PNG 1170x2532 (iPhone 13) con una frase al azar. `?hoy=1` usa la del día |
| `GET /frases/fondo?n=N` | PNG con la frase en la posición `N` de un orden fijo y mezclado: `n=1, 2, 3…` recorre las 100 sin repetir y vuelve a empezar en la 101 |
| `GET /frases/fondo/siguiente` | PNG con la frase que sigue en la secuencia. El contador vive en Redis y avanza en cada pedido; necesita las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (Vercel > Storage > Upstash Redis). Sin ellas responde 503 |
| `GET /frases/:id/fondo` | PNG con la frase `id` (también `/frases/fondo/:id` o `/frases/fondo?id=N`); 404 si no existe |

Cada frase: `{ "id": 1, "texto": "...", "autor": "..." }`.

Las frases están en `frases.json`; para agregar una, añade un objeto con un `id` nuevo.

## Fondo de pantalla para iPhone

`/frases/fondo` dibuja la frase y su autor sobre un fondo oscuro (satori + resvg, fuentes DejaVu embebidas en `fonts/dejavu.js`).
El atajo de iPhone hace dos pasos: *Obtener contenido de URL* con esa ruta y *Establecer fondo de pantalla*.
