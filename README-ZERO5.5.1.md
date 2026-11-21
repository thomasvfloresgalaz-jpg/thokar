# ZERO 5.5.1 — Conversaciones, vista previa, cilindrada y tipografía

- **Chats** en la quinta pestaña inferior, con un acceso adicional **Chat con THOKAR** dentro de cada ficha. Historial persistente por patente, también para archivados.
- **Búsqueda global** de marca, patente, síntomas y códigos DTC dentro de todos los chats; un resultado abre el vehículo correcto y salta a la conversación donde aparece. También hay búsqueda con anterior/siguiente dentro del chat.
- **Resumen para el cliente** desde cada chat: Gemini propone una explicación breve sin inventar reparaciones; puede apoyarse en notas confirmadas por el mecánico. El texto se puede editar y copiar o incorporar voluntariamente a una orden Pendiente específica. Ninguna respuesta sobrescribe un registro por sí sola.
- **Compartir en WhatsApp** abre una vista previa editable, permite seleccionar trabajo, diagnóstico, repuestos, precios y pagos, copiar o abrir WhatsApp.
- **Pegar datos** extrae cilindrada de `Modelo: QASHQAI 4X4 2.0 AUT` → `2.0 L`, sin confundir `4X4` ni el año. Prevalece un campo explícito Cilindrada si lo hay. La ficha puede mostrar cilindradas inferidas de vehículos antiguos y nuevas búsquedas, sin tocar patentes ni VIN parciales.
- **Tipografía**: Montserrat, títulos con peso ExtraBold y textos legibles. Se descarga como hoja de estilo desde Google Fonts; sin internet se utiliza el tipo de letra de respaldo del teléfono. Montserrat es libre bajo SIL OFL 1.1. No es una afirmación de identidad exacta con la tipografía de MACHBANK.
- Los archivos y claves localStorage `thokar.zero2.*` siguen sin cambiar. No borrar datos del sitio ni desinstalar la PWA al actualizar.
- Para producción, este ZIP contiene solo los archivos necesarios. Los tests se ejecutaron en el entorno de desarrollo y no se distribuyen.
