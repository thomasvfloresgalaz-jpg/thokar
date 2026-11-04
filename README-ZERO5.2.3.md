# THOKAR ZERO 5.2.3 — cambios

- Las recomendaciones de repuestos se guardan por patente en `thokar.zero2.partsCache`, con fecha, datos de vehículo consultados y última pregunta/respuesta por categoría.
- Cerrar/reabrir Repuestos recomendados **no consulta de nuevo** a Gemini si existen resultados guardados.
- Botón explícito **Actualizar recomendaciones**. Si cambian motor, VIN, año u otros datos de contexto, se advierte que el resultado es antiguo; se mantiene visible hasta actualizar manualmente. Si Gemini falla al actualizar, se conserva el anterior.
- Eliminar vehículo también elimina sus recomendaciones asociadas. Archivar conserva las recomendaciones.
- Se corrigió el orden de capas de los efectos de fondo, se retiró el fundido de opacidad de las vistas y se reforzó la legibilidad de ficha y acciones en ambos temas.
- Se integró el arte THOKAR facilitado por el usuario, sin alterar su identidad: `thokar-logo.png`, íconos PWA y favicon específico.
- Cambio de caché frontend y build backend a 5.2.3. No se modificaron los nombres de claves previas, para conservar datos existentes.

## Despliegue

Reemplazar los archivos del repositorio por el contenido completo del ZIP; mantener `GEMINI_API_KEY`, `BOOSTR_API_KEY` y `APP_TOKEN` únicamente en Render. Revisar el icono de Chrome/PWA tras la actualización, ya que el sistema operativo puede conservar el icono instalado en caché hasta reinstalar la PWA.
