# THOKAR ZERO 5.2.5 — ventanas adaptables Android

- Corregida la altura de todas las hojas: el contenedor se limita al viewport visual disponible (Android/PWA y teclado), con margen superior seguro en vez de 90dvh fijo.
- Barra de arrastre y botón **Cerrar** visibles arriba de un contenido que se desplaza independientemente.
- En detalle de trabajo, **Editar**, **Marcar listo/pendiente** y **Compartir** permanecen visibles en un pie fijo dentro de la hoja mientras se consulta su contenido.
- En formularios, el pie no se mantiene fijo sobre el teclado ni tapa campos.
- Ajuste ante cambios del teclado y al regresar a la aplicación; se conserva el desplazamiento solo dentro de la hoja, sin mover la pantalla de fondo.
- Transición de apertura/cierre preservada, reabrir una hoja cancela cierre anterior pendiente.
- No cambia el esquema de localStorage, API, lógica de IA, recomendaciones ni identidad gráfica.
- Sin borrar cachés ni datos de usuario; el caché PWA tiene versión propia.

**Limitación:** Las pruebas Chromium móviles son simulaciones; Android/Samsung real puede comportarse distinto y debe comprobarse tras desplegar.
