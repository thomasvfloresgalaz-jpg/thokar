# THOKAR 4.0.4 — Chat primero

Cambios de esta versión:

- La sección Asistente usa una ventana de chat grande, sin ocupar toda la pantalla.
- La cabecera del chat muestra la patente como contacto y debajo marca, modelo, año, combustible, km, versión/motor/VIN cuando existan.
- El historial tiene scroll interno y el compositor queda fijo al pie del chat.
- Las preguntas rápidas a Gemini están debajo de la ventana.
- Debajo se agregan búsquedas/recomendaciones para Aceite y filtro, Bujías, Pastillas delanteras, Filtro de aire, Filtro de cabina, Distribución y Amortiguadores.
- Se quitó el logo grande del contenido de la aplicación. El logo original se conserva en los iconos PWA/Android/iPhone.
- Build: `4.0.4-chat-first`.

---

# THOKAR Taller 4.0 — Boostr API + Render

Esta versión elimina por completo Playwright y la automatización de PatenteChile. La búsqueda por patente se hace desde el backend de THOKAR contra la API oficial de Boostr.

## Arquitectura

`THOKAR (navegador) -> /api/vehiculo/:patente -> backend Node/Render -> Boostr API`

La API key de Boostr **nunca va en app.js ni en el navegador**. Sólo se configura como variable de entorno secreta en Render.

## Archivos importantes

- `server.js`: endpoint propio de THOKAR y servidor de la PWA.
- `boostrProvider.js`: llamada a `https://api.boostr.cl/vehicle/{patente}.json` y mapeo de datos.
- `package.json`: ya no incluye Playwright.
- `Dockerfile`: usa `node:22-alpine`, mucho más liviano que la imagen anterior con Chromium.
- `render.yaml`: declara `BOOSTR_API_KEY` como variable secreta (`sync: false`).

## 1. Conseguir API key de Boostr

Solicita/contrata tu API key en Boostr. La consulta de patentes requiere `X-API-KEY`.

El plan gratuito vigente documenta hasta 5 consultas diarias; los campos extendidos (VIN/chasis, color, kilometraje, combustible, fabricante, procedencia, puertas, versión, cilindrada y transmisión) dependen del plan contratado.

## 2. Reemplazar archivos en GitHub

Sube todos los archivos de este ZIP a la raíz de tu repositorio y reemplaza los existentes.

Si aún aparecen del proyecto anterior, puedes borrar de GitHub estos archivos porque ya no se usan:

- `patenteChileProvider.js`
- `vehicleParser.js`
- `vehicleParser.test.js`

El archivo nuevo que debe existir es:

- `boostrProvider.js`
- `boostrProvider.test.js`

## 3. Configurar la API key en Render

En Render abre tu servicio THOKAR y entra a:

**Environment -> Environment Variables -> Add Environment Variable**

Agrega exactamente:

- Key: `BOOSTR_API_KEY`
- Value: `TU_API_KEY_REAL_DE_BOOSTR`

No uses comillas y no pongas la clave dentro de GitHub.

Variables opcionales ya soportadas:

- `BOOSTR_TIMEOUT_MS=12000`
- `PLATE_REQUESTS_PER_10_SECONDS=4`
- `BOOSTR_BASE_URL=https://api.boostr.cl`

## 4. Volver a desplegar

En Render usa:

**Manual Deploy -> Clear build cache & deploy**

## 5. Comprobar que quedó bien

Abre:

`https://TU-DOMINIO.onrender.com/healthz`

Debe responder parecido a:

```json
{
  "ok": true,
  "app": "THOKAR Taller",
  "vehicleLookup": "boostr",
  "configured": true,
  "layout": "flat",
  "build": "4.0.0-boostr"
}
```

Si `configured` sale `false`, falta `BOOSTR_API_KEY` en Render.

## Datos que THOKAR puede mapear

Según lo que incluya tu plan de Boostr, THOKAR reconoce:

- patente y dígito verificador
- marca, modelo, año y tipo
- número de motor
- VIN/chasis
- color
- combustible
- kilometraje registrado
- fabricante
- país y región de procedencia
- puertas
- versión
- cilindrada/tamaño de motor
- transmisión
- código SII
- tasación fiscal

THOKAR no envía `include=owner` y el backend usa una lista explícita de campos técnicos; si Boostr devolviera un objeto `owner`, se descarta.

## Notas de límites

Boostr documenta un rate-limit general de hasta 5 solicitudes cada 10 segundos. THOKAR aplica además un límite local conservador de 4 cada 10 segundos por IP.
## Cambio 4.0.2 — Asistente

- El chat y su historial ahora viven dentro de una ventana/panel de altura fija.
- El historial hace scroll dentro del panel, no en toda la página.
- La caja para escribir es más grande y queda en la parte inferior de la ventana.
- Las consultas rápidas quedan dentro de la misma ventana.
- El resto de THOKAR no fue modificado.

