# THOKAR ZERO 5.2.4 — Navegación Android

## Qué se corrigió
- Corrección específica de la barra inferior cortada por la barra de navegación del sistema en Android 15/16 cuando la PWA se ejecuta en modo independiente.
- El dock ahora suma 10 px sobre la zona segura real disponible: utiliza la diferencia entre la altura visible y el viewport, y una reserva de 48 px **solo en Android PWA independiente** cuando el sistema no reporta una zona segura válida.
- Usa `max()` para evitar duplicar compensaciones en dispositivos que reportan bien `safe-area-inset-bottom`.
- Oculta el dock mientras el teclado virtual está abierto, para que no tape formularios ni aparezca encima del teclado.
- Ajusta el acceso oculto **Archivados** y el espacio inferior del contenido al mismo valor, evitando cubrir las últimas tarjetas.
- Conserva caché de repuestos por patente, mini-chat, logo original, datos, gestos y resto de funciones de 5.2.3.

## Diagnóstico
El dock original usa `position:fixed` con `bottom: 10px + env(safe-area-inset-bottom)`. En PWA Android con visualización de borde a borde, algunos WebViews/Chrome informan `safe-area-inset-bottom: 0` incluso con barra de navegación del sistema superpuesta. La captura muestra un dock detrás de la zona de navegación Android. Esta es la causa probable; sin inspección remota del teléfono no se puede confirmar la medición exacta del viewport del usuario.

## Verificación
Se incluye `zero524.test.js` y pruebas visuales simuladas por Chromium. Se requiere validación final en el Galaxy/Android real tras subir los archivos y actualizar PWA.

No se borran ni migran `localStorage`, chats, órdenes ni vehículos.
