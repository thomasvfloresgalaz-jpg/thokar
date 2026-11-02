# THOKAR · Prototipo 5.1 · Liquid Motion

Prototipo desplegable de THOKAR para GitHub -> Render -> PWA Android. Conserva las claves `thokar.*`, chats, registros, vehículos, fotos, respaldo, Gemini, Wake Lock y proveedores de datos.

## Build y caché

- Build frontend/backend: `prototipo-5-liquid-motion`
- Service Worker: `thokar-prototipo-5-liquid-motion`
- package: `5.0.0-prototype.5`

Frontend, backend y Service Worker usan el mismo identificador para evitar el bucle de “Hay una versión nueva disponible”.

## Cambios principales

- Rediseño Liquid Motion inspirado en patrones de vidrio flotante, adaptado a Android.
- El vidrio se usa solo en controles flotantes: navegación inferior, selector Hablar/Registro/Datos, compositor, avisos y hojas.
- Tarjetas, tablas, Registro y Datos son superficies opacas.
- Barra inferior: Inicio / Consultar / Libreta; se contrae al bajar y reaparece al subir.
- Hoja de búsqueda arrastrable con tres puntos de anclaje y física de resorte.
- Selector Hablar / Registro / Datos con pulgar móvil y resorte.
- Efectos de vidrio: Completo / Reducido / Apagado. La app detecta Nivel 1/2/3 y puede degradar el efecto si el dispositivo va lento.
- Botones con respuesta elástica al toque.
- Diseño Día/Noche conservado.
- Plantilla pegable para completar patente, tipo, marca, modelo, año, color, N.º motor, chasis/VIN, procedencia, fabricante, sello y combustible.
- VIN / número de motor confirmados manualmente siguen teniendo prioridad para IA y repuestos.

## Fuentes vehiculares

La consulta mantiene:

1. AutoRiesgo gratuito cuando entrega ficha técnica.
2. PRT/reSTART.
3. Cruce SII conservador.
4. Boostr como fallback/complemento manual.
5. Foto o plantilla pegada como confirmación manual.

THOKAR no inventa VIN, número de motor ni cilindrada exacta.

## Variables Render

Obligatorias:

- `APP_TOKEN` — 32+ caracteres.
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Opcionales:

- `RESTART_API_KEY`
- `BOOSTR_API_KEY`
- `AUTORIESGO_TIMEOUT_MS=12000`
- `RESTART_TIMEOUT_MS=12000`
- `BOOSTR_TIMEOUT_MS=12000`
- `PLATE_REQUESTS_PER_MINUTE=12`
- `AI_REQUESTS_PER_MINUTE=30`
- `PLATE_CACHE_MS=21600000`

Nunca pongas claves en GitHub ni en el frontend.

## Despliegue

1. Descomprime el ZIP.
2. Sube **el contenido de la carpeta** a la raíz de GitHub.
3. Render -> **Manual Deploy -> Clear build cache & deploy**.
4. Abre `/healthz`.
5. Debe mostrar: `"build":"prototipo-5-liquid-motion"`.
6. Abre la URL desde Chrome Android y prueba Inicio, búsqueda, Hablar, Registro, Datos y Ajustes.
7. En Ajustes > Efectos de vidrio podrás ver el nivel activo detectado en tu teléfono.

Los datos anteriores se mantienen porque no se cambian las claves de almacenamiento.
