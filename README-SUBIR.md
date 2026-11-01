# THOKAR Taller — versión 3.2 FLEX

Versión para Render/GitHub con estructura plana.

## Qué cambia

- El extractor ya no depende de una tarjeta/clase concreta de PatenteChile.
- Lee tablas, listas de definición, pares etiqueta/valor y texto visible de la página completa.
- Reconoce formatos `Etiqueta: valor`, `Etiqueta valor` y etiqueta/valor en líneas separadas.
- Además de la ficha técnica, intenta reconocer antecedentes vehiculares como multas, revisión técnica/gases, permiso de circulación, SOAP, kilometraje registrado, transporte público, restricción, sello y siniestro cuando estén disponibles.
- Los datos personales del propietario (nombre, RUT/RUN, dirección, teléfono, correo, fecha de nacimiento, etc.) se excluyen en el backend y no se envían al navegador.
- Si vuelve a cambiar la página, el error SOURCE_CHANGED incluye únicamente etiquetas no personales observadas para facilitar el diagnóstico.

## Subir la actualización

1. Descomprime el ZIP.
2. En GitHub, `Add file` -> `Upload files`.
3. Reemplaza los archivos de la raíz por los de esta carpeta y confirma el commit.
4. En Render: `Manual Deploy` -> `Clear build cache & deploy`.
5. Comprueba `/healthz` y luego realiza una búsqueda desde THOKAR.

## Comprobación local

```bash
npm test
```

Las pruebas verifican extracción en distintos formatos y que los campos de identidad del propietario se descartan.
