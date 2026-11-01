# THOKAR 5.0.0 · Workspace

Rediseño completo de la PWA manteniendo el backend Node/Render, Boostr y Gemini.

## Cambios principales

- Inicio con casos recientes y buscador de patente fijo abajo.
- Buscar una patente distinta limpia automáticamente los datos técnicos del vehículo anterior y abre un contexto nuevo de IA.
- Se eliminó el botón **Vehículo nuevo**. El cambio de vehículo se hace buscando otra patente.
- Abrir un vehículo guardado desde Inicio conserva el historial propio de ese vehículo.
- Espacio de trabajo por vehículo con hoja inferior arrastrable y tres vistas: **Hablar / Registro / Datos**.
- Tema claro de alto contraste como predeterminado, oscuro y automático opcionales.
- Asistente en formato documento, no burbujas para la IA; mensajes propios en píldoras.
- Respuestas en streaming, indicador de certeza, pasos marcables, copiar/guardar/checklist/compartir.
- Acciones rápidas, dictado, cámara y dibujo genérico original con zonas de consulta.
- Registro por línea de tiempo, fotos nuevas en IndexedDB, checklists con progreso e informe compartible.
- Datos confirmados, cliente opcional con WhatsApp, km por visita y próximos servicios.
- Wake Lock solo en Hablar.
- Service Worker network-first con actualización manual y botón Forzar actualización.
- `APP_TOKEN` obligatorio en backend, rate limit y caché de patentes se conservan.

## Migración

La versión 5.0 conserva las claves de almacenamiento existentes:

- `thokar.settings`
- `thokar.vehicles`
- `thokar.chats`
- `thokar.log`
- `thokar.draft`

Los vehículos guardados, libreta y chats existentes se leen directamente. Se agregan campos nuevos sin borrar los anteriores. Los chats también se copian a IndexedDB al iniciar la versión 5.0. Las fotos nuevas del Registro se guardan en IndexedDB.

## Render: variables necesarias

En **Render → Environment** deben existir:

- `APP_TOKEN` — 32 caracteres o más. Es el mismo valor que se escribe en Ajustes > Token THOKAR.
- `BOOSTR_API_KEY` — API key de Boostr.
- `GEMINI_API_KEY` — API key de Gemini.
- `GEMINI_MODEL` — el modelo Gemini que tengas habilitado en tu cuenta.

No pongas las claves de Boostr ni Gemini en el frontend o GitHub.

## Despliegue

1. Reemplaza en GitHub todos los archivos por los de este ZIP.
2. En Render usa **Manual Deploy → Clear build cache & deploy**.
3. Abre `/healthz` y confirma:

```json
{
  "ok": true,
  "vehicleLookup": "boostr",
  "configured": true,
  "geminiConfigured": true,
  "protected": true,
  "build": "5.0.0-workspace"
}
```

4. Abre THOKAR en el teléfono.
5. En **Ajustes**, pega en `Token THOKAR` el mismo `APP_TOKEN` de Render.
6. Pulsa **Probar conexión**.

## Prueba recomendada del cambio automático de vehículo

1. Busca una patente A y realiza una pregunta a la IA.
2. Vuelve a Inicio.
3. Busca una patente B distinta.
4. La ficha debe mostrar solo los datos de B.
5. La vista Hablar de B debe empezar sin mensajes de A.
6. Pregunta a la IA por el vehículo B y confirma que la respuesta mencione solo su marca/modelo/motor.
7. Vuelve a Inicio y abre A desde Casos recientes: A conserva su propio historial.

## Android/PWA

La app usa `100dvh`, `interactive-widget=resizes-content`, `visualViewport`, safe areas y History API. El botón Atrás cierra primero modales/hojas. La actualización nueva solo se activa al tocar **Actualizar**.
