# THOKAR ZERO 5.5.2

Aplicación web PWA de mecánica automotriz a domicilio, construida con HTML/CSS/JavaScript y backend Node.js/Express. Paquete completo para GitHub + Render; **no incluye archivos de pruebas**.

## Cambios de 5.5.2

- **Ficha siempre primero:** la ficha del vehículo permanece arriba. Junto al botón existente **Pegar datos** aparece **Copiar datos**, que copia al portapapeles la información disponible en un formato de líneas similar al que se puede pegar (patente, tipo, marca, modelo, año, color, motor, chasis, cilindrada, combustible, procedencia, fabricante).
- **Compras para este vehículo:** tarjeta integrada **inmediatamente debajo de la ficha**, sin ventana extra y sin enviar mensajes a tiendas. Permite añadir productos, indicar cantidad, marcar Comprado, eliminar y guardar automáticamente por patente. Incluye el botón voluntario **Agregar repuestos de un trabajo**, que toma los repuestos del último trabajo con piezas registradas de ese mismo vehículo, sin duplicar nombres existentes. La lista no cambia el presupuesto.
- **Varios servicios en una orden:** dentro de Registrar trabajo se pueden agregar **Servicios adicionales** con nombre y precio individual de mano de obra. Se suman al cobro principal y aparecen en los detalles del registro y en el mensaje de compartir. Los repuestos y materiales permanecen como totales de la orden. Trabajos anteriores sin servicios adicionales siguen conservando su forma y sus importes.
- **Ventanas de trabajo inicialmente expandidas:** Registrar trabajo, Trabajos registrados y el detalle del trabajo se abren expandidos. Se pueden contraer/expandir con el tirador gris, con el contenido desplazable dentro de la ventana.

## Datos y migración

Se mantienen las claves existentes `thokar.zero2.vehicles`, `thokar.zero2.archivedVehicles`, `thokar.zero2.logs`, `thokar.zero2.chats`, `thokar.zero2.recordDrafts`, `thokar.zero2.partsCache`, `thokar.zero2.settings`. La nueva lista se guarda en `thokar.zero2.shopping` y permanece vinculada a la patente base. **Archivar conserva** las compras; **eliminar el vehículo borra** su lista junto al resto de datos. No borrar datos de Chrome ni reinstalar PWA para actualizar.

## Instalación

1. Respaldar el repositorio y los datos locales antes de una actualización importante.
2. Reemplazar los archivos de la raíz del repositorio GitHub con los de este ZIP y conservar la conexión a Render. Los archivos ya existentes en GitHub no se eliminan automáticamente al subir un ZIP.
3. Conservar en Render las variables de entorno de la versión previa, como `GEMINI_API_KEY`, `BOOSTR_API_KEY` y `APP_TOKEN` cuando corresponda. Nunca subir credenciales a GitHub.
4. Desplegar con `npm start`. La PWA actualiza el caché de archivos de aplicación, pero no borra el almacenamiento local del usuario.

## Verificaciones y limitaciones

- `node --check app.js`, `node --check server.js`, `node --check sw.js`.
- Navegador Chromium sin navegación externa: se ejecutaron pruebas integrando HTML/CSS/JS **en memoria**, en tamaños 393×780 Día y 360×640 Noche, sin errores JS. Se verificó la ficha y portapapeles, compras por vehículo, importación desde trabajos, precios en vivo, servicios adicionales, registros anteriores y estado expandido de las ventanas.
- La interacción con el backend Render y el teclado físico Samsung requieren validación en el dispositivo real; las pruebas en memoria no sustituyen un despliegue completo.
