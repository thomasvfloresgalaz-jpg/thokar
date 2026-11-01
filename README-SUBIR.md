# THOKAR 6.2.3 · Control de consultas IA

Hotfix sobre la rama Cabina / Sol para evitar consultas innecesarias y avisos 429 confusos.

## Cambios principales

- **Datos ya no consulta Gemini automáticamente** al abrir la pestaña.
- Las recomendaciones de aceite, filtro, bujías y refrigerante se consultan solo cuando tú presionas **Consultar / actualizar recomendaciones IA**.
- Las recomendaciones quedan guardadas por patente.
- Si cambias VIN, motor, cilindrada, versión o transmisión, la recomendación anterior queda marcada como desactualizada, pero THOKAR **no vuelve a consultar por sí solo**.
- Bloqueo de consultas duplicadas y cooldown corto para evitar dobles toques.
- El backend hace como máximo **dos intentos externos** a Gemini por una acción del usuario.
- Los errores 429 ahora distinguen: límite de THOKAR, límite temporal de Gemini o límite de búsquedas de patente.
- Si el servidor informa `Retry-After`, THOKAR muestra cuántos segundos hay que esperar.
- `AI_REQUESTS_PER_MINUTE` queda en 30 como margen de seguridad, pero el cambio principal es que ya no se generan solicitudes automáticas.
- Se mantienen Cabina/Sol, chats por patente, identificación técnica confirmable, Registro, fotos, Boostr, Wake Lock y APP_TOKEN.

## Variables de Render

Obligatorias:

- `APP_TOKEN` (32 caracteres o más)
- `BOOSTR_API_KEY`
- `GEMINI_API_KEY`

Configuración incluida:

- `GEMINI_MODEL=gemini-3.8-flash`
- `PLATE_REQUESTS_PER_MINUTE=12`
- `AI_REQUESTS_PER_MINUTE=30`

## Despliegue

1. Reemplaza los archivos del repositorio por los de este paquete.
2. En Render usa **Manual Deploy → Clear build cache & deploy**.
3. Abre `/healthz` y verifica:

```json
{
  "build": "6.2.3-rate-fix",
  "configured": true,
  "geminiConfigured": true,
  "protected": true
}
```

4. Si el teléfono conserva archivos anteriores, usa **Forzar actualización** una vez.

## Comportamiento esperado

Abrir **Datos** no consume IA. Ver o editar VIN/motor/cilindrada tampoco consume IA. Solo se consulta Gemini al enviar un mensaje de chat, probar la conexión o pulsar expresamente el botón de recomendaciones.
