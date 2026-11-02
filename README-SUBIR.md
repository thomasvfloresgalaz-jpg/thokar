# THOKAR · Prototipo 2

App completa para GitHub → Render. No es una maqueta HTML separada.

## Incluye
- Nuevo diseño de Inicio, Vehículo, Hablar, Registro, Datos y Ajustes.
- Tema Oscuro / Claro.
- Menú lateral y navegación Android con History API.
- Chat Gemini, fotos, dictado, acciones rápidas, Guardar con Deshacer y Checklist.
- Registro, informes de servicio, IndexedDB, respaldo/restauración, Wake Lock y PWA.
- Datos confirmables para repuestos: VIN/chasis, código y número de motor, cilindrada, versión y transmisión.
- Proveedor experimental PRT/reSTART + SII como principal y Boostr como fallback.

## Despliegue
1. Descomprime este ZIP.
2. Reemplaza el contenido de la raíz del repositorio GitHub.
3. En Render: Manual Deploy → Clear build cache & deploy.
4. Abre `/healthz` y confirma `build: prototipo-2-product-redesign`.

Variables: APP_TOKEN, GEMINI_API_KEY, GEMINI_MODEL y BOOSTR_API_KEY para fallback. RESTART_API_KEY es opcional.
