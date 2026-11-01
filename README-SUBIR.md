# THOKAR 4.1.0 — UX móvil / taller

Esta versión mantiene la arquitectura plana, Render, Boostr y la PWA, pero mejora la experiencia móvil.

## Cambios principales

- Asistente tipo chat con `100dvh` y mejor manejo del teclado móvil.
- La barra inferior se oculta mientras escribes para dejar más espacio al chat.
- Botón ⚡ junto al cuadro de mensaje: abre Mantención, Diagnóstico y búsquedas de repuestos/catálogos.
- Cuando el chat está vacío aparecen 6 accesos grandes como punto de partida.
- La cabecera del chat es tocable y abre la ficha resumida del vehículo.
- Cada respuesta de IA tiene: **Copiar**, **Guardar** y **Checklist**.
- Guardar lleva la respuesta directamente a la Libreta del vehículo.
- Checklist convierte pasos de la IA en casillas marcables dentro de la Libreta.
- Respuestas largas se contraen con **Ver más / Ver menos**.
- La IA recibe instrucciones para responder con Resumen, Pasos y Verificar cuando corresponde.
- La app despierta/comprueba el backend al abrir y muestra `Conectando…` mientras Render responde.
- Aviso visible si hay una versión nueva de la PWA.
- Pantalla despierta mientras estás en Asistente, cuando el navegador lo permite.
- Ficha Vehículo: resumen compacto, kilometraje visible, botones Consultar IA/Libreta y datos técnicos desplegables.
- Vehículos recientes como accesos horizontales.
- Controles táctiles de 48 px o más en acciones principales.
- Build: `4.1.0-ux`.

## Seguridad opcional para las consultas Boostr

La API de patente ya tenía rate-limit. Esta versión añade protección opcional con `APP_TOKEN`.

En Render → Environment puedes crear:

- `APP_TOKEN`: una cadena larga que inventes tú.

Luego en THOKAR → Ajustes → **Token THOKAR**, pega exactamente el mismo valor. El token se guarda solo en ese teléfono.

Si NO configuras `APP_TOKEN` en Render, la app sigue funcionando como antes; la protección es opcional.

`BOOSTR_API_KEY` continúa guardándose solo en Render.

## Actualizar en GitHub / Render

1. Reemplaza los archivos del repositorio con los de este ZIP.
2. En Render: **Manual Deploy → Clear build cache & deploy**.
3. Comprueba `/healthz`. Debe mostrar:

```json
{
  "ok": true,
  "vehicleLookup": "boostr",
  "configured": true,
  "layout": "flat",
  "build": "4.1.0-ux"
}
```

Si usas `APP_TOKEN`, `/healthz` además mostrará `"protected": true`.

## PWA instalada

El Service Worker usa una caché nueva (`v12-ux`). Si Android mantiene una versión anterior, cierra y vuelve a abrir THOKAR. Si persiste, desinstala la PWA y vuelve a instalarla desde Chrome.
