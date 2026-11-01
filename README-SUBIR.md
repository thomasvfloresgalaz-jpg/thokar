# THOKAR · Prototipo 1

Prototipo separado de la 6.2.3 para probar una nueva estrategia de obtención de datos de vehículos sin depender de las 5 consultas diarias de Boostr.

## Estrategia de consulta

1. **Caché de THOKAR**: si la patente ya fue consultada recientemente, se devuelve la ficha guardada en memoria del servidor.
2. **PRT/reSTART**: fuente principal. Consulta el historial de revisiones técnicas por patente.
3. **SII/reSTART**: si PRT entrega marca/modelo, busca coincidencias del catálogo/tasación SII.
   - Si hay una única coincidencia, puede completar datos técnicos/fiscales disponibles.
   - Si hay varias versiones posibles, THOKAR **no adivina** cilindrada, versión o transmisión; conserva las coincidencias como referencia.
4. **Boostr fallback**: sólo se consulta si PRT/reSTART no entrega una ficha utilizable o falla de verdad la fuente principal. Un `429` temporal de reSTART NO gasta Boostr: THOKAR pide esperar unos segundos y volver a intentar.

## Variables de Render

Obligatorias:

- `APP_TOKEN` (32 caracteres o más)
- `GEMINI_API_KEY`

Opcionales:

- `BOOSTR_API_KEY`: respaldo si PRT/reSTART falla o no encuentra la patente.
- `RESTART_API_KEY`: opcional. El servicio funciona sin key; una key gratuita permite un límite mayor según la documentación de reSTART.

Incluidas en `render.yaml`:

- `RESTART_TIMEOUT_MS=12000`
- `BOOSTR_TIMEOUT_MS=12000`
- `GEMINI_MODEL=gemini-3.8-flash`
- `PLATE_REQUESTS_PER_MINUTE=12`
- `AI_REQUESTS_PER_MINUTE=30`
- `PLATE_CACHE_MS=21600000`

## Qué verás en Datos

Se agrega una tarjeta **Fuentes externas** que indica si la ficha vino de:

- `PRT/reSTART`
- `PRT/reSTART + SII`
- `Boostr fallback`

También muestra la última revisión PRT disponible y cuántas coincidencias SII se encontraron.

## Despliegue

1. Este paquete es experimental. Conserva tu ZIP **6.2.3** como respaldo.
2. Reemplaza temporalmente los archivos del repositorio por los de **Prototipo 1**.
3. En Render usa **Manual Deploy → Clear build cache & deploy**.
4. Revisa `/healthz`. Debe mostrar aproximadamente:

```json
{
  "vehicleLookup": "restart-prt+sii->boostr-fallback",
  "restartConfigured": true,
  "boostrConfigured": true,
  "build": "prototipo-1-vehicle-sources"
}
```

`boostrConfigured` puede ser `false` y el prototipo seguirá consultando PRT/reSTART.

## Importante

Este prototipo no obtiene ni muestra datos del propietario. Sólo trabaja con información técnica del vehículo y fuentes públicas de PRT/SII.
