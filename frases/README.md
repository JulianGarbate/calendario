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
| `GET /frases/fondo` | PNG 1170x2532 (iPhone 13) con una frase al azar. `?hoy=1` usa la del día, `?id=N` una puntual |

Cada frase: `{ "id": 1, "texto": "...", "autor": "..." }`.

Las frases están en `frases.json`; para agregar una, añade un objeto con un `id` nuevo.

## Fondo de pantalla para iPhone

`/frases/fondo` dibuja la frase y su autor sobre un fondo oscuro (satori + resvg, fuentes DejaVu embebidas en `fonts/dejavu.js`).
El atajo de iPhone hace dos pasos: *Obtener contenido de URL* con esa ruta y *Establecer fondo de pantalla*.
