# THOKAR · Prototipo 3

Prototipo 4.1 de THOKAR basado en la rama estable 6.2.3. Mantiene el flujo GitHub -> Render -> PWA Android y todos los datos locales existentes. Añade una interfaz más suave tipo glass, mejora del banner de actualización y pegado de ficha externa para completar VIN / motor / procedencia.

## Qué cambia

- Interfaz completamente rediseñada: cálida, suave y táctil, con tema Noche/Día/Automático.
- Build: `prototipo-3-warm-identity`.
- Service Worker: `thokar-prototipo-3-warm-identity`.
- La búsqueda vehicular consulta primero fuentes gratuitas/complementarias y deja Boostr como respaldo o complemento manual.
- AutoRiesgo agent lookup se usa únicamente para `vehicle_data`; THOKAR no conserva ni muestra datos de propietario.
- PRT/reSTART y SII complementan marca/modelo/año y datos inequívocos; nunca se elige una motorización ambigua.
- VIN y número de motor quedan destacados en Datos.
- Si falta VIN/motor puedes:
  1. leerlos desde una foto del padrón/PRT/grabado y confirmarlos antes de guardar;
  2. usar “Completar con Boostr” manualmente (consume una consulta de tu plan).
- Gemini no debe inferir VIN, número de motor ni cilindrada exacta ausente.

## Importante sobre PRT

Los registros oficiales SGPRT contemplan número de motor, número de chasis y VIN cuando existe. Sin embargo, este prototipo todavía NO descarga ni indexa automáticamente los archivos crudos mensuales de PRT: la fuente PRT integrada es reSTART. El índice crudo oficial se deja para un prototipo posterior cuando podamos validar de forma robusta su formato y coste de procesamiento en Render.

## Variables de Render

Obligatorias:

- `APP_TOKEN` — 32+ caracteres, debe coincidir con Ajustes.
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Opcionales / proveedores:

- `RESTART_API_KEY` — opcional; reSTART puede funcionar sin key con límites menores.
- `BOOSTR_API_KEY` — respaldo/complemento manual.
- `AUTORIESGO_TIMEOUT_MS=12000`
- `RESTART_TIMEOUT_MS=12000`
- `BOOSTR_TIMEOUT_MS=12000`
- `PLATE_REQUESTS_PER_MINUTE=12`
- `AI_REQUESTS_PER_MINUTE=30`
- `PLATE_CACHE_MS=21600000`

No pongas ninguna clave en `app.js`, GitHub o el navegador.

## Despliegue

1. Descomprime el ZIP.
2. Sube **el contenido** de la carpeta a la raíz del repositorio de GitHub.
3. En Render: **Manual Deploy -> Clear build cache & deploy**.
4. Comprueba `/healthz`.
5. Debe aparecer: `"build":"prototipo-3-warm-identity"`.
6. Abre primero desde Chrome Android. Cuando confirme la nueva interfaz, abre/instala la PWA.

Los datos de versiones anteriores conservan las mismas claves de almacenamiento (`thokar.*`), por lo que no se hace una migración destructiva.
