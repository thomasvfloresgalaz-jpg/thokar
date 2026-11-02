# THOKAR · Prototipo 5.3 · Chat Window Fix

Prototipo desplegable para GitHub -> Render -> PWA Android. Conserva vehículos, chats, Registro, fotos, respaldo, Gemini, Wake Lock y proveedores.

## Build y caché

- Build frontend/backend: `prototipo-5.3-mobile-template`
- Service Worker: `thokar-prototipo-5.3-mobile-template`
- package: `5.2.0-prototype.5`

## Correcciones de esta versión

- Hablar / Registro / Datos ya no reconstruyen toda la pantalla del vehículo al cambiar de pestaña. Solo cambia el contenido de la vista seleccionada.
- Al seleccionar una pestaña, el scroll exterior se posiciona en el selector/contenido, no en el encabezado del vehículo.
- Hablar funciona como una ventana independiente con su propio scroll. Si ya hay conversación, abre mostrando los mensajes más recientes.
- El compositor vive dentro de la ventana de chat y se adapta a la altura visible del teclado.
- Las opciones de sistemas del automóvil quedan en una cuadrícula compacta; se eliminó el dibujo intermedio del auto.
- Las hojas de diagnóstico se abren completas automáticamente.
- La hoja Buscar vehículo usa `visualViewport` y la variable `--vh`, por lo que se recoloca sobre el teclado sin arrastrarla manualmente.
- Se conserva Liquid Motion, la barra inferior, Datos, plantilla pegable, VIN/motor manuales y las fuentes vehiculares del Prototipo 5.

## Variables Render

Mantén las mismas variables que en Prototipo 5: `APP_TOKEN`, `GEMINI_API_KEY`, `GEMINI_MODEL`; opcionales `RESTART_API_KEY`, `BOOSTR_API_KEY` y los timeouts/límites existentes.

## Despliegue

1. Sube el contenido de esta carpeta a la raíz de GitHub.
2. Render -> Manual Deploy -> Clear build cache & deploy.
3. `/healthz` debe mostrar `"build":"prototipo-5.3-mobile-template"`.
4. En Android prueba: cambiar pestañas, abrir Hablar con un chat largo, Buscar patente con teclado abierto y una consulta guiada desde los cuadros de sistemas.

Los datos anteriores se conservan porque las claves de almacenamiento no cambian.
