# THOKAR · THOKAR 1.0.0 oficial · Hablar a pantalla completa

Parte de 5.7.0 y conserva el contenido nuevo del chat. Al entrar a Hablar, la ficha del vehículo sale de escena y el área útil se reparte entre las pestañas superiores, conversación, compositor y navegación inferior.

## Cambios
- Hablar usa una vista de trabajo de viewport completo.
- La ficha del vehículo se oculta solo mientras Hablar está activo.
- El compositor conserva siempre su fila: adjuntar, texto, micrófono y enviar.
- Los mensajes son el único scroll interno.
- `visualViewport` actualiza la altura útil en Android.
- Con teclado abierto se reduce la conversación; el compositor permanece visible y la navegación inferior se oculta temporalmente para dejar espacio al teclado.
- Registro y Datos conservan su comportamiento normal.
- Sin migración de vehículos, chats, libreta ni ajustes.

## Despliegue
Reemplaza los archivos del repositorio por los de este ZIP, haz commit/push y espera el deploy de Render. En THOKAR pulsa **Actualizar** cuando aparezca el aviso de versión.

Build: `thokar-1.0.0-official-liquid-launch`  
Cache bust: `v100`
