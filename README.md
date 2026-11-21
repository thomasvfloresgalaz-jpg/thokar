# THOKAR ZERO 5.5.0 · Chats por vehículo

PWA de mecánica automotriz (frontend HTML/CSS/JavaScript vanilla y backend Node.js/Express) para uso de THOKAR.

## Lo nuevo

- **Chats** es una sección principal: lista conversaciones por **marca, modelo y patente**, incluyendo vehículos archivados, ordenadas por la actividad más reciente. El historial técnico se conserva **por patente**, con aislamiento de cada vehículo.
- El chat es una pantalla completa, no una hoja que deba arrastrarse: cabecera propia, historial desplazable, campo de escritura y enviar anclados al área visible incluso en Android al cambiar el tamaño del teclado. Se puede salir y regresar sin perder mensajes.
- La ficha del vehículo ya no muestra “Diagnosticar con THOKAR”; el chat se abre desde **Chats**. El botón TF de la cabecera abre **Ajustes**.
- El chat técnico **no rellena ni reemplaza automáticamente el Diagnóstico de una orden de trabajo**. Los diagnósticos existentes se conservan.
- En la edición de una orden, **Diagnóstico → Redactar para el cliente con IA** toma exclusivamente las notas escritas y propone un texto breve, sin tecnicismos innecesarios y sin inventar trabajos realizados. La propuesta se puede **aprobar** o **descartar** antes de guardar.
- En conversaciones, el backend prioriza el modelo Flash configurado como respaldo para reducir latencia, limita las llamadas a dos intentos con tiempos acotados y devuelve errores comprensibles para reintentar. No garantiza que Gemini o Render estén siempre disponibles.
- Se retiraron de la interfaz las herramientas de ZERO 5.4.x que no se utilizaban: modelo 3D, asistente eléctrico, preparación, cronómetro, captura de escáner, línea de tiempo, multitarea y chat flotante. Se conserva la lógica principal de búsqueda de patente, ficha, registros, Bitácora, repuestos recomendados, archivo/reactivación, cotizaciones y compartir WhatsApp.

## Datos y migración

No se cambian las claves locales `thokar.zero2.*`. Vehículos, órdenes, conversaciones anteriores, recomendaciones guardadas, registros y archivos de vehículos deben permanecer accesibles al actualizar, siempre que **no borres los datos del sitio ni reinstales la PWA**.

Los datos antiguos de herramientas retiradas permanecen en almacenamiento local, pero ya no tienen interfaz en 5.5.0. Esto evita una eliminación irreversible durante la actualización.

## Instalación

1. Copia el contenido del ZIP en la raíz del repositorio GitHub conectado a Render; conserva la conexión del servicio existente.
2. Elimina del repositorio los archivos antiguos que ya no deben desplegarse (p. ej. `car3d.js`, archivos `*.test.js` y README históricos): subir un ZIP no los borra automáticamente de GitHub.
3. Haz commit y push. Render ejecutará `npm install` y `npm start` desde `package.json` / Dockerfile.
4. En Render conserva `APP_TOKEN` (mínimo 32 caracteres), `GEMINI_API_KEY`, `BOOSTR_API_KEY` y demás variables de entorno que ya tenías. Nunca subas claves al repositorio.
5. Abre THOKAR con tu mismo perfil de Chrome. Si el Service Worker actualiza, cierra y vuelve a abrir la PWA sin limpiar el almacenamiento.

El modelo principal es configurable mediante `GEMINI_MODEL`. El backend prioriza `GEMINI_FALLBACK_MODEL` (predeterminado `gemini-3.6-flash`) para solicitudes de chat, y después prueba `GEMINI_MODEL` (predeterminado `gemini-3.8-flash`) solo en fallos transitorios. Si esos nombres no estuvieran disponibles para tu clave, configura modelos válidos en Render.

## Verificación y límites

- `npm test` valida sintaxis de `app.js`, `server.js` y `sw.js`.
- Se realizaron pruebas de interacción con respuesta simulada de Gemini: chats de vehículos distintos, persistencia, segundo mensaje, reintento, teclado simulado y redacción para clientes con aprobación explícita.
- El ZIP de producción no trae archivos de pruebas ni herramientas retiradas.
- **No se verificó** la latencia de Gemini real con las credenciales de Render ni se probó físicamente la barra de chat en el Samsung: deben validarse después del despliegue.
- La información de diagnóstico asistido no sustituye la comprobación técnica ni los procedimientos OEM.
