# THOKAR 5.1.0 · Tabs

Esta versión corrige la navegación de THOKAR 5.0 a partir del uso real en teléfono.

## Cambios principales

- Se mantiene **Inicio** como pantalla principal con los vehículos/casos guardados.
- Las tarjetas de Inicio muestran patente, marca/modelo/año, motor, combustible, kilometraje, última actividad y estado cuando esos datos existen.
- El buscador de patente ahora es una barra compacta inferior con botón de búsqueda por icono.
- Al abrir un vehículo se entra a una **pantalla completa**, sin hoja inferior arrastrable.
- Arriba a la izquierda aparece el botón **Inicio** con icono de casa.
- La pantalla del vehículo tiene tres pestañas fijas: **Chat / Registro / Datos**.
- El Chat usa todo el espacio disponible y su historial puede desplazarse normalmente hacia arriba y abajo.
- Registro y Datos tienen su propio scroll normal de pantalla.
- Se recupera por defecto la identidad oscura de THOKAR: negro/gris oscuro + rojo.
- El tema claro sigue disponible manualmente desde Ajustes.
- Buscar otra patente sigue limpiando el contexto activo y el chat de esa nueva búsqueda para no mezclar vehículos.
- Se conserva toda la lógica de Boostr, Gemini, Libreta, IndexedDB, APP_TOKEN y Service Worker.

## Render

Mantén estas variables en **Render → Environment**:

- `APP_TOKEN`
- `BOOSTR_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Luego usa:

**Manual Deploy → Clear build cache & deploy**

Comprueba:

`https://TU-DOMINIO.onrender.com/healthz`

Debe incluir:

```json
"build": "5.1.0-tabs"
```

## Actualización en Android

El Service Worker usa ahora la caché `thokar-taller-v21-tabs`.

Si la PWA continúa mostrando el diseño anterior, usa **Ajustes → Forzar actualización**.
