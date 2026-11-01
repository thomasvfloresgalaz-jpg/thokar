# THOKAR 6.0.1.0 · Cabina / Sol

Versión rediseñada de THOKAR sobre la misma arquitectura plana GitHub → Render → PWA Android.

## Cambios principales

- Nuevo sistema visual **Cabina** (oscuro retrofuturista rojo) y **Sol** (alto contraste para trabajo exterior).
- Inicio renombrado visualmente a **Registro de unidades**.
- Vehículos/casos con patente, datos, actividad y estado LED.
- Espacio de trabajo por vehículo con ficha superior y hoja inferior en 3 alturas: asomada, media y completa.
- Vistas **Hablar / Registro / Datos** dentro de la hoja.
- Al consultar una patente nueva se abre primero **Datos**, para confirmar marca/modelo/motor antes de usar el chat.
- `Guardar vehículo` y `Estado del caso` quedan al final de Datos.
- Datos confirmados ahora muestran recomendaciones automáticas de Gemini para aceite, filtro, bujías y refrigerante. La sugerencia se presenta como orientación y se puede copiar al campo confirmado.
- Gemini incorpora reintentos automáticos y fallback interno a un modelo Flash estable para errores transitorios/timeouts.
- Se mantiene separación de chats por patente, eliminación de vehículo, informe de servicio, checklists, fotos, Wake Lock, respaldo, Boostr y seguridad con APP_TOKEN.

## Variables de Render

Obligatorias:

- `APP_TOKEN` (32 caracteres o más)
- `BOOSTR_API_KEY`
- `GEMINI_API_KEY`

Opcional:

- `GEMINI_MODEL` (por defecto `gemini-3.8-flash`)

No es necesario configurar el modelo de respaldo: THOKAR usa internamente `gemini-3.6-flash` si el modelo principal falla de forma transitoria.

## Despliegue

1. Reemplaza los archivos del repositorio por los de este paquete.
2. En Render usa **Manual Deploy → Clear build cache & deploy**.
3. Abre `/healthz` y verifica:

```json
{
  "build": "6.2.3-plates-zones",
  "configured": true,
  "geminiConfigured": true,
  "protected": true
}
```

4. En THOKAR → Ajustes, pega el mismo `APP_TOKEN` de Render.
5. Si la PWA conserva una versión anterior, usa **Forzar actualización**.

## Nota visual

La V6 no carga fuentes ni recursos desde CDNs. Usa pilas tipográficas locales del sistema para mantener la PWA liviana y disponible sin conexión.


## Cambios 6.2
- VIN, código/número de motor, cilindrada, versión y transmisión pueden confirmarse manualmente.
- Los datos manuales tienen prioridad para Gemini, catálogos y recomendaciones.
- Gemini no puede inventar cilindrada si no está confirmada.
- Cambiar Estado del caso ya no re-renderiza Datos ni devuelve el scroll arriba.
