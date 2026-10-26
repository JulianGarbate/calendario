# Frases motivadoras

Servidor JSON independiente, sin dependencias ni login. Todas las rutas son públicas y de solo lectura.

```
cd frases
node server.js            # puerto 3000, o PORT=8080 node server.js
```

| Ruta | Devuelve |
|---|---|
| `GET /frases` | Todas las frases |
| `GET /frases/random` | Una frase al azar |
| `GET /frases/hoy` | Una frase distinta por día (UTC), estable durante el día |
| `GET /frases/:id` | Una frase por id, o 404 |

Cada frase: `{ "id": 1, "texto": "...", "autor": "..." }`.

Las frases están en `frases.json`; para agregar una, añade un objeto con un `id` nuevo.
