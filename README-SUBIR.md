# THOKAR Taller — versión con backend

Esta versión reemplaza la consulta directa a Apify por un endpoint propio:

`GET /api/vehiculo/:patente`

El frontend consulta ese endpoint y el backend abre PatenteChile con Playwright. Solo devuelve una lista blanca de datos técnicos del vehículo: patente, tipo, marca, modelo, año, color, número de motor, chasis/VIN, combustible, procedencia y fabricante. No devuelve ni registra nombre, RUT, dirección, teléfono, correo u otros datos personales del propietario.

## Importante

PatenteChile indica públicamente que no ofrece API ni acceso de terceros a su base de datos. Esta integración automatiza únicamente la interfaz web pública y puede dejar de funcionar si el sitio cambia, limita automatizaciones o presenta CAPTCHA. THOKAR no intenta evadir CAPTCHA ni bloqueos. Conserva el botón **Pegar datos** como alternativa manual.

## Subir a Render con Docker

1. Crea un repositorio Git con todos los archivos y carpetas de este proyecto.
2. En Render crea un **Web Service** desde el repositorio.
3. Render detectará `render.yaml`/`Dockerfile` y desplegará Node + Chromium.
4. Comprueba `https://TU-DOMINIO/healthz`; debe devolver `{"ok":true,...}`.
5. Abre la app y prueba una patente conocida.

No la subas como sitio estático puro (por ejemplo GitHub Pages), porque `/api/vehiculo/...` necesita un proceso Node y Chromium ejecutándose en el servidor.

## Ejecutar localmente

Necesitas Node.js 22+.

```bash
npm install
npx playwright install --with-deps chromium
npm test
npm start
```

Abre `http://localhost:3000`.

## Variables opcionales

Copia `.env.example` si tu plataforma permite variables de entorno:

- `SOURCE_TIMEOUT_MS`: timeout de la fuente; por defecto 45000 ms.
- `PLATE_REQUESTS_PER_MINUTE`: límite por IP; por defecto 8.
- `HEADLESS`: `true` en servidor.
- `PATENTECHILE_URL`: URL base de la fuente, si cambia.

## Privacidad y diagnóstico

El backend no guarda resultados en una base de datos. La ficha se sigue guardando localmente en el navegador, igual que en la versión anterior. Los errores del proveedor se transforman en códigos claros (`SOURCE_TIMEOUT`, `SOURCE_BLOCKED`, `SOURCE_CHANGED`, etc.) sin enviar al frontend contenido bruto de la página.

## Estructura

- `public/`: PWA que ve el usuario.
- `server.js`: servidor HTTP y endpoint `/api/vehiculo/:patente`.
- `backend/`: proveedor PatenteChile y filtro de campos técnicos.
- `test/`: pruebas del filtro de privacidad/parser.
- `Dockerfile`: despliegue con Chromium listo para Playwright.
