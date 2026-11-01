# THOKAR Taller — versión plana para GitHub + Render

Esta edición está preparada para que TODOS los archivos queden en la raíz del repositorio, tal como está actualmente tu GitHub.

## Estructura esperada

```text
thokar/
├── index.html
├── app.js
├── lib.js
├── styles.css
├── sw.js
├── manifest.webmanifest
├── apple-touch-icon.png
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
├── patenteChileProvider.js
├── vehicleParser.js
├── vehicleParser.test.js
├── server.js
├── package.json
├── Dockerfile
├── render.yaml
├── .dockerignore
└── .env.example
```

## Qué cambió

- `server.js` ahora importa `./patenteChileProvider` y `./vehicleParser` desde la raíz.
- `vehicleParser.test.js` importa `./vehicleParser` desde la raíz.
- El frontend también está en la raíz.
- Los iconos ya no usan la ruta `icons/...`.
- Express NO publica toda la raíz: usa una lista blanca para no exponer los archivos del backend.
- `/api/vehiculo/:patente` sigue sin almacenarse en caché.
- El service worker usa una caché nueva (`v5-flat`).

## Reemplazo en GitHub

Sube estos archivos a la raíz de tu repositorio y reemplaza los que ya existan.

Después ve a Render:

1. `Manual Deploy`
2. `Clear build cache & deploy`
3. Espera que el servicio arranque.
4. Abre `https://TU-DOMINIO.onrender.com/healthz`

La respuesta correcta debe incluir:

```json
{
  "ok": true,
  "app": "THOKAR Taller",
  "vehicleLookup": "backend",
  "layout": "flat"
}
```

Luego abre `/` y prueba una patente.

## Privacidad

El parser usa una lista blanca de campos técnicos. No devuelve nombre, RUT, dirección, teléfono, correo ni otros campos personales del propietario.

## Si PatenteChile bloquea la automatización

THOKAR devuelve un error `SOURCE_BLOCKED` y no intenta evadir CAPTCHA ni controles anti-bot.
