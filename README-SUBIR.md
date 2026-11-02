# THOKAR · Prototipo 5.6.1 · Chat vertical + Day Glass Fix

Versión de prueba posterior a 5.5.5.

## Correcciones principales
- El cambio a Hablar conserva el ancla visual antes de reemplazar contenido, evitando el salto momentáneo al inicio de la ficha.
- Hablar calcula su alto desde el viewport visible real y la barra inferior, sin imponer un mínimo que desborde pantallas pequeñas.
- Las gotas Liquid Glass de ambas barras vuelven a desplazarse físicamente: se eliminó una regla CSS posterior que anulaba sus transforms.
- La cabecera THOKAR incorpora una tira de vidrio borroso para mantener legibilidad sobre la ficha.
- La tarjeta superior usa el kilometraje manual y, si no existe, el kilometraje registrado por la fuente del vehículo.
- Datos y Registro mantienen altura natural al salir de Hablar.

No hay migración de datos ni cambios de backend/API.
