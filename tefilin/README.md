# ¿Puedo ponerme tefilín?

Servidor independiente que responde `sí` o `no`, sin login ni dependencias. Todas las rutas son públicas y de solo lectura.

```
cd tefilin
node server.js            # puerto 3000, o PORT=8080 node server.js
```

| Ruta | Devuelve |
|---|---|
| `GET /tefilin` (o `/`) | `sí` o `no` en texto plano |
| `GET /tefilin?detalle=1` | `{ "puedo": true, "respuesta": "sí", "motivo": "Es de día" }` |

Responde `no` en Shabat, en Yom Tov (Rosh Hashaná, Yom Kipur, Sucot, Shemini Atzeret, Simjat Torá, Pésaj y Shavuot, calendario de diáspora), antes de Mishéyakir (sol a 11,5° bajo el horizonte) y después de la puesta del sol.

Variables de entorno (opcionales):

| Variable | Por defecto | Para qué |
|---|---|---|
| `TEFILIN_LAT`, `TEFILIN_LON` | Buenos Aires | Ubicación para amanecer y atardecer |
| `TZ_APP` | `America/Argentina/Buenos_Aires` | Zona horaria |
| `TEFILIN_JOL_HAMOED` | `si` | Con `no`, responde `no` en Jol HaMoed |
