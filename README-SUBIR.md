# THOKAR Taller 4.1 — AutoRiesgo sin API key + Render

Esta versión reemplaza Boostr por el endpoint público para agentes/LLMs de AutoRiesgo. No usa Playwright, PatenteChile ni API key.

## Arquitectura

`THOKAR (navegador) -> /api/vehiculo/:patente -> backend Node/Render -> AutoRiesgo agent/lookup`

Endpoint utilizado:

`GET https://api.autoriesgo.cl/api/v1/report/agent/lookup?patente=PATENTE`

La documentación pública de AutoRiesgo indica que las rutas con `agent` están optimizadas para agentes/LLMs, son GET-friendly y no requieren clave.

## Qué procesa THOKAR

El backend lee únicamente `vehicle_data` de la respuesta y descarta el resto. Reconoce, cuando AutoRiesgo los entregue:

- patente
- marca
- modelo
- año
- tipo
- versión
- color
- combustible
- motor
- VIN/chasis
- kilometraje
- fabricante
- procedencia
- cilindrada
- transmisión
- puertas
- estado/mes de revisión técnica

No procesa datos de propietario y no usa `purchase_full_report`.

## 1. Reemplazar archivos en GitHub

Sube todos los archivos de este ZIP a la raíz de tu repositorio y reemplaza los existentes.

Borra estos archivos antiguos si todavía aparecen:

- `boostrProvider.js`
- `boostrProvider.test.js`
- `patenteChileProvider.js`
- `vehicleParser.js`
- `vehicleParser.test.js`

Deben existir ahora:

- `autoRiesgoProvider.js`
- `autoRiesgoProvider.test.js`
- `server.js`
- `package.json`
- `Dockerfile`
- `render.yaml`

## 2. Render: ya no necesitas API key

Puedes borrar de Render la variable `BOOSTR_API_KEY` si todavía existe. Esta versión no la lee.

Variables opcionales:

- `AUTORIESGO_TIMEOUT_MS=12000`
- `PLATE_REQUESTS_PER_MINUTE=4`
- `AUTORIESGO_BASE_URL=https://api.autoriesgo.cl`

## 3. Volver a desplegar

En Render usa:

**Manual Deploy -> Clear build cache & deploy**

## 4. Comprobar el despliegue

Abre:

`https://TU-DOMINIO.onrender.com/healthz`

Debe responder parecido a:

```json
{
  "ok": true,
  "app": "THOKAR Taller",
  "vehicleLookup": "autoriesgo-agent",
  "configured": true,
  "layout": "flat",
  "build": "4.1.0-autoriesgo"
}
```

Después abre THOKAR y prueba una patente.

## Límites y estabilidad

El endpoint gratuito es un servicio externo y AutoRiesgo puede cambiar su formato, disponibilidad o condiciones. THOKAR aplica además un límite local de 4 consultas por minuto por IP para evitar abuso.

Esta integración usa el endpoint público documentado; no automatiza páginas web ni intenta evadir CAPTCHA o bloqueos.
