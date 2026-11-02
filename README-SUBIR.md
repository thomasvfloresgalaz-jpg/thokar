# THOKAR · Prototipo 5.7.0 · Reconstrucción de Hablar

Versión creada desde Prototipo 5.6.2. La interfaz de Hablar fue reconstruida para eliminar la cadena de parches de geometría de 5.5.x/5.6.x.

## Qué cambia
- Hablar vuelve al flujo normal del workspace: ya no se posiciona como `fixed` ni como overlay del documento.
- Estructura única de tres filas: estado / mensajes / compositor.
- Solo los mensajes tienen scroll vertical interno.
- El compositor ocupa su propia fila y permanece visible dentro del chat.
- Sin desplazamiento horizontal del chat ni de sus acciones.
- La altura disponible se calcula entre la barra Hablar/Registro/Datos y la navegación inferior, sin mover el panel a coordenadas globales.
- Se conserva la lógica existente de Gemini, streaming, fotos, voz, acciones, persistencia, Wake Lock y conversaciones.
- Se mantienen Liquid Glass, navegación inferior, kilometraje y el resto de la app.

## Datos
No hay migración. No se cambia el formato de vehículos, chats, registros ni ajustes.

## Pruebas
`npm test` ejecuta la suite vigente. Las pruebas de geometrías visuales eliminadas de 5.5.x/5.6.x se retiraron porque comprobaban implementaciones reemplazadas; se añadieron pruebas específicas del nuevo layout 5.7.0.

## Despliegue
1. Reemplaza en GitHub los archivos por los de este ZIP.
2. Espera el deploy de Render.
3. Abre THOKAR y pulsa **Actualizar** cuando aparezca el aviso.
4. Verifica Hablar con conversación larga, teclado abierto/cerrado y cambio Hablar → Registro → Datos → Hablar.

Build: `prototipo-5.7.0-talk-rebuild`  
Cache bust: `p570`
