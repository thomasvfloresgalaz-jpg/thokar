# THOKAR 4.2.0 — POLISH / PWA

Esta versión aplica el rediseño UX/UI y los cambios técnicos de prioridad alta sin cambiar la arquitectura plana.

## Variables OBLIGATORIAS en Render

En **Render → Environment** define:

- `APP_TOKEN`: inventa una cadena privada de **32 caracteres o más**. La app ahora **falla cerrado** si falta.
- `BOOSTR_API_KEY`: tu clave de Boostr.
- `GEMINI_API_KEY`: tu clave de Google AI Studio/Gemini.
- `GEMINI_MODEL`: opcional; por defecto `gemini-3.8-flash`.

En el teléfono abre **THOKAR → Ajustes → Token THOKAR** y pega exactamente el mismo `APP_TOKEN`. Las claves de Boostr y Gemini nunca se guardan en el teléfono.

## Cambios 4.2

- Sistema visual consistente: escala de superficies, radios, espacios y botones de 52 px.
- Iconos SVG consistentes; se eliminaron iconos-emoji de las acciones principales.
- Chat tipo WhatsApp con `interactive-widget=resizes-content`, control del teclado y navegación inferior oculta al escribir.
- Botón Atrás de Android cierra primero hojas inferiores.
- Streaming de Gemini desde el backend: la respuesta aparece mientras se genera.
- Indicador de escritura con tres puntos y botón para volver al último mensaje.
- Mensajes del usuario en rojo oscuro tintado para no saturar la interfaz.
- Copiar, Guardar, Checklist y Compartir en respuestas de IA.
- Guardar en Libreta es de un toque, con título automático y `Deshacer`.
- Checklist se estructura con Gemini en JSON y muestra vista previa editable.
- Checklist guardado muestra progreso `3/5` y casillas grandes.
- `APP_TOKEN` obligatorio y comparación segura; rate limit para patente e IA.
- Caché en memoria de consultas de patente (6 h por defecto) para no gastar consultas repetidas.
- Gemini y Boostr viven solo en Render.
- PWA: actualización manual segura. La versión nueva espera hasta que pulses **Actualizar**.
- Ajustes incluye **Buscar actualización** y **Forzar actualización**.
- Wake Lock reactivado al volver al Asistente; se puede desactivar en Ajustes.
- Los borradores del chat se guardan localmente para no perder texto en una actualización/reinicio.
- Manifest con atajos `Nueva consulta` y `Libreta` al mantener pulsado el icono (si Android lo admite).
- Fechas amigables (`31 oct 2026`) y miles con punto.

## Subir

1. Reemplaza en GitHub todos los archivos por los de este ZIP.
2. Render → **Manual Deploy → Clear build cache & deploy**.
3. Abre `/healthz`. Debe mostrar `build: "4.2.0-polish"`, `configured: true`, `geminiConfigured: true` y `protected: true`.
4. En THOKAR → Ajustes pega el mismo `APP_TOKEN` de Render y pulsa **Probar conexión completa**.

## Importante

El Service Worker usa `thokar-taller-v13-polish`. Ya no ejecuta `skipWaiting()` automáticamente durante la instalación; por eso no debería recargar la PWA mientras estás escribiendo.
