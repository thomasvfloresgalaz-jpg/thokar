# THOKAR ZERO 5.3.1 · versión oficial

Aplicación web/PWA THOKAR (HTML, CSS, JavaScript y backend Node.js/Render). Esta versión parte de ZERO 5.2.5 y corrige el sistema compartido de ventanas de Android sin cambiar claves de almacenamiento ni datos del usuario.

## Qué se corrigió

- Las ventanas se anclan al **viewport visual**; su borde inferior se mantiene encima de la barra de navegación del dispositivo cuando Chrome informa correctamente los límites/safe areas. Ya no existe una reserva adicional ficticia de 48 px.
- Las ventanas abren con su altura natural o con un máximo inicial de 78% del área disponible, en vez de expandirse todas hasta arriba.
- El tirador gris superior ahora es un control táctil real: **arrastrar arriba** amplía, **arrastrar abajo** contrae y desde el tamaño mínimo un gesto abajo cierra. Tocar el tirador alterna tamaño. También funciona con teclado (flechas arriba/abajo).
- Los botones del detalle de trabajo y el compositor del chat están fuera del contenido desplazable, en pies propios. El contenido y los formularios pueden desplazarse verticalmente sin tapar acciones.
- Recalculamos las alturas ante cambio de viewport/teclado, sin volver a dibujar la pantalla principal.
- Mantenemos la búsqueda de patentes, los chats e historiales por vehículo, bitácora, recomendaciones guardadas y logotipo original.

## Despliegue

1. Reemplazar los archivos del repositorio GitHub con el contenido completo de este ZIP.
2. Confirmar que Render despliega el nuevo commit. Mantener las variables existentes de Render (`GEMINI_API_KEY`, `BOOSTR_API_KEY`, `APP_TOKEN` si aplica), sin poner secretos en GitHub.
3. Abrir THOKAR y comprobar el número **ZERO 5.3.1** en Ajustes. El Service Worker tiene nuevo identificador de caché y se actualiza con navegación/reapertura según el navegador.
4. **No borrar datos de navegación**: los datos siguen bajo las claves `thokar.zero2.*` en el mismo origen.

## Verificación

- `node --test *.test.js` valida las pruebas automatizadas incluidas.
- `node --check app.js`, `node --check server.js`, `node --check sw.js` validan la sintaxis.
- Se realizaron pruebas de navegador móvil en Chromium (Día/Noche y distintos tamaños) y gestos táctiles simulados. Esto **no sustituye** una prueba en el Samsung real con navegación por botones y por gestos.

Revisa `PRUEBAS-EN-SAMSUNG.md` antes de distribuirla a otros usuarios.
