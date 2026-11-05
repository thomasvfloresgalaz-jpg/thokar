# THOKAR ZERO 5.3.1 — Cabecera compacta de órdenes de trabajo

## Cambio visual
- Al abrir **Registrar trabajo** o **Editar registro**, la primera fila de la ventana muestra el título discreto rojo a la izquierda y **Cerrar** a la derecha.
- Debajo queda visible el nombre/modelo del vehículo, más grande y con alto contraste: blanco en Noche, negro en Día.
- La patente y el estado real (amarillo **Pendiente** / verde **✓ Listo**) se presentan bajo el nombre.
- Siguen inmediatamente las pestañas **Cobro / Diagnóstico / Lista de tareas**.
- Se eliminó el antiguo título duplicado en la zona desplazable.
- La cabecera del registro no se pierde al desplazar el contenido, y el tirador gris sigue operativo.

## Alcance
Solo se modifica la presentación y la versión. Se conservan los mismos IDs, campos y claves de almacenamiento (`thokar.zero2.*`), sin migración o borrado de datos. Las hojas distintas al formulario de registro mantienen su cabecera anterior.

## Verificación
- Ejecutar `npm test` y `node --check app.js`, `node --check server.js`, `node --check sw.js`.
- Navegador móvil: abrir Bitácora > trabajo > Editar; probar Pendiente/Listo, Día/Noche, Cobro/Diagnóstico/Lista, cierre y otros paneles.
- Verificar en Samsung real con navegación por gestos y por tres botones antes de dar por validado el hardware.
