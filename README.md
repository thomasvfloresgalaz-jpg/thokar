# THOKAR ZERO 5.3.2

PWA mecánica THOKAR para Chrome/Android y backend Node.js/Render.

## Despliegue

1. Subir los archivos de este ZIP a la raíz del repositorio GitHub.
2. Eliminar de la raíz del repositorio los `zero*.test.js` y `README-ZERO*` antiguos si quieres reducir el número de archivos. No debes borrar datos del navegador.
3. Render instala dependencias (`npm install`) y ejecuta `npm start`.
4. Configurar `GEMINI_API_KEY`, `BOOSTR_API_KEY` y, si aplica, `APP_TOKEN` en las variables privadas de Render; nunca en GitHub.

## Novedades

Bitácora abre con **Pendiente**, seguida por **Listo** y **Todos**. Los trabajos finalizados se muestran en una ficha diferente, con el vehículo identificado, total, desglose y acciones fijas al pie. No se modifica la información guardada ni el aislamiento por patente.

## Comprobaciones

`npm test` verifica la sintaxis de la aplicación y el servidor. Los tests detallados de regresión no se incluyen en el ZIP de despliegue.
