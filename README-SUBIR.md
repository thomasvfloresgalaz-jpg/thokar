# THOKAR Taller — parche PatenteChile 3.3.0-inputfix

Esta versión mantiene la estructura plana de GitHub/Render y corrige la detección del formulario de PatenteChile.

## Qué cambió

- Busca primero el campo que la web pública muestra actualmente: `Ingrese Patente • Ejemplo AA1122 • BBCC11`.
- Ya no depende de un único selector: revisa placeholder, aria-label, name, id, maxlength y el formulario cercano.
- Busca también dentro de iframes si el sitio mueve el buscador.
- Primero intenta usar el buscador tal como aparece al cargar la portada; solo pulsa `Buscar vehículos` si el campo no apareció.
- El botón final se identifica como `Buscar`, evitando confundirlo con `Buscar vehículos`, `Buscar motos`, `Buscar por RUT` o `Buscar por VIN`.
- Usa el user-agent real de Chromium/Playwright, en vez de uno con versión artificial.
- Si vuelve a fallar, el error incluye únicamente metadatos seguros de los inputs visibles (tipo/placeholder/name), nunca valores escritos ni datos personales.
- El filtro de datos del propietario se mantiene: no se recopilan nombre, RUT, dirección, teléfono o correo.

## Actualización en GitHub

Reemplaza los archivos de la raíz del repositorio con los de este ZIP. Después, en Render usa **Manual Deploy → Clear build cache & deploy**.

Comprueba primero `/healthz`. Debe incluir:

```json
{"ok":true,"app":"THOKAR Taller","vehicleLookup":"backend","layout":"flat","build":"3.3.0-inputfix"}
```

Después prueba la búsqueda desde la interfaz.
