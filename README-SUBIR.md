# THOKAR 5.3.0 · Datos primero, zonas claras y eliminar vehículo

Esta versión parte de THOKAR 5.1 y corrige problemas detectados usando la app desde el teléfono.

## Cambios principales

- El chat ya no se vuelve a renderizar completo al enviar un mensaje. Esto elimina el salto visual hacia arriba y luego hacia abajo.
- El streaming actualiza únicamente la respuesta que está escribiendo la IA y respeta la posición del usuario si está leyendo mensajes anteriores.
- Cada historial de chat se guarda automáticamente bajo su **patente**. En Chat aparece una indicación de la patente cuyo historial se está usando.
- La acción ambigua **Guardar** fue reemplazada por **Registrar diagnóstico**. Esto copia esa respuesta de IA al Registro de la patente actual; no controla el guardado del chat.
- **Crear checklist** guarda el checklist dentro de Registro para esa misma patente y muestra un botón **Ver checklist** para ir directamente a él.
- En Registro, **Informe de servicio** y **Registrar** ya no flotan ni tapan información: aparecen únicamente al final de la lista.
- El formulario Registrar añade un campo opcional **Próximo trabajo / mantención**, además de próxima fecha y próximo kilometraje.
- El Informe de servicio fue reescrito para el cliente. Separa trabajo realizado, diagnóstico/revisión, repuestos/recomendaciones y próxima mantención.
- Se mantienen Inicio, pantalla completa del vehículo y pestañas **Chat / Registro / Datos** de la versión 5.1.
- Se mantiene el cambio automático de contexto por patente para que Gemini no mezcle vehículos.

## Informe de servicio

El texto compartible usa solo información realmente guardada en Registro. Puede incluir:

- trabajo realizado;
- diagnóstico o revisión;
- repuestos/recomendaciones;
- checklists realizados;
- próxima mantención o trabajo, con fecha y/o kilometraje.

Si completas el nombre del cliente en Datos, el informe también lo usa en el saludo.

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
"build": "5.3.0-vehicle-zones"
```

## Actualización en Android

El Service Worker usa la caché `thokar-taller-v23-vehicle-zones`.

Si la PWA continúa mostrando una versión anterior, usa **Ajustes → Forzar actualización**.
