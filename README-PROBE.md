# THOKAR – prueba de puente PatenteChile

Esta compilación NO intenta evadir CAPTCHA ni verificaciones. Añade una sonda de diagnóstico que abre PatenteChile con Chromium estándar, usa la patente de ejemplo pública `UB2023` y captura únicamente metadatos de las peticiones de red generadas al pulsar **Buscar**.

No devuelve cookies, cabeceras de autenticación, tokens ni contenido de la ficha.

## Cómo usarla

1. Sube todos los archivos a tu repositorio GitHub, reemplazando la versión actual.
2. En Render usa **Manual Deploy → Clear build cache & deploy**.
3. Comprueba `/healthz`; debe mostrar `build: 3.4.0-bridge-probe`.
4. Abre:

   `/api/diagnostico/patentechile`

5. Copia el JSON completo que devuelve y envíalo a ChatGPT.

### Qué buscamos

Si `candidateRequests` contiene una petición con `containsProbePlate: true`, especialmente `xhr` o `fetch`, podremos evaluar si es un endpoint HTTP simple que pueda llamarse directamente desde el backend.

Si `challengeDetected: true` y no aparece ninguna petición candidata utilizable, PatenteChile está bloqueando antes de exponer una ruta reutilizable y el puente directo no será viable sin evadir sus controles.
