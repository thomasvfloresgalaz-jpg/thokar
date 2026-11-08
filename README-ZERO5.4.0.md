# THOKAR ZERO 5.4.0

PWA de mecánica automotriz a domicilio, creada en HTML, CSS y JavaScript vanilla, con backend Node.js para patente y Gemini.

## Novedades

1. **Botón + inteligente:** pulsación normal = Nueva atención; mantener presionado ≈ 0,5 s = Acciones rápidas.
2. **Multitarea por vehículo:** botón «Recientes», cambio de vehículo y acceso «Continuar último vehículo» en Inicio.
3. **Gestos y respuesta táctil:** confirmación háptica cuando el navegador la admite; activable en Ajustes. Desliza horizontalmente Cobro/Diagnóstico/Lista de tareas en el editor de registro.
4. **Modo terreno offline:** se puede consultar información local y guardar registros sin red. La búsqueda de patentes, la IA y las fotos requieren internet. No hay sincronización con cuentas ni un servidor remoto de registros: los datos permanecen en el dispositivo.
5. **Interpretar escáner:** Acciones rápidas → Interpretar escáner. Acepta foto de pantalla/captura; comprime a JPEG, envía al backend/Gemini y presenta un texto editable que el usuario confirma antes de incorporar a un diagnóstico pendiente. La fotografía no se guarda.
6. **Centro de acciones:** herramienta contextual «Acciones rápidas» dentro de cada vehículo.
7. **Sugerencias contextuales:** sobre las respuestas de THOKAR se ofrece guardar observaciones en la línea de tiempo. Nunca ejecuta cambios sin intervención del usuario.
8. **Cronómetro por patente:** iniciar, pausar, retomar, reiniciar y usar horas como dato inicial editable de un nuevo registro.
9. **Línea de tiempo:** cronómetro, creación/edición de trabajos, cambio de estado y observaciones confirmadas por el usuario.
10. **Chat minimizable:** control ▾ en el chat, barra pequeña para reabrirlo; historial por vehículo conservado.

Además: acceso a **Archivados (n)** dentro del encabezado de Vehículos y **Reactivar** en cada vehículo reparado. Sin tarjeta flotante tapando patentes.

## Datos y privacidad

Se conservan las claves de almacenamiento existentes (`thokar.zero2.*`). Las preferencias y herramientas nuevas usan `thokar.zero2.extras`. No borrar los datos del sitio si se quiere conservar el historial. 

Las fotografías del escáner se envían a Gemini a través del servidor para análisis, únicamente al pulsar «Leer imagen con IA». La salida debe verificarse contra la fotografía y el vehículo real. No sustituye procedimientos de diagnóstico ni catálogos técnicos.

## Instalación

- Subir los archivos del ZIP a la raíz del repositorio GitHub utilizado por Render.
- `npm start` inicia `server.js`; `npm test` comprueba sintaxis sin depender de archivos de pruebas.
- Mantener `GEMINI_API_KEY`, `BOOSTR_API_KEY` y, si aplica, `APP_TOKEN` solamente en variables de entorno de Render.
- En Chrome Android, abrir el sitio al menos una vez con internet para dejar el shell PWA disponible sin conexión.

Este es un **ZIP de producción sin archivos `*.test.js`**. Los tests locales de elaboración no se incluyen.
