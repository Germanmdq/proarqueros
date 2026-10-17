# Catálogo Proarqueros

Los 198 productos y sus precios provienen de la tabla de productos de `Hoja1` de la lista suministrada. Se mantienen los modelos de adulto y junior por separado, con un identificador estable basado en su fila de origen. El sitio utiliza `src/data/products.json`; no necesita acceso al archivo Excel para instalarse ni compilarse.

Los importes de 3 y 6 cuotas representan el total financiado. La ficha divide ese total por la cantidad de cuotas. Los números de guantes y talles de indumentaria son referencias de los encabezados de talles de la planilla; su disponibilidad por variante se confirma al consultar. No se asigna el stock de las tablas laterales a productos distintos por coincidencia de fila. Cuando falta un talle, presentación o color, se indica a confirmar.

Por indicación del propietario se configuraron 8 unidades por producto y se intercalan cuatro imágenes VGFC en todas las tarjetas. Las imágenes que no corresponden al modelo se identifican como ilustrativas. El carrito limita a 8 la suma de las variantes de un producto en la sesión del comprador. Esta configuración inicial no sustituye un inventario compartido en un servidor.

El importador opcional es `scripts/import-product-catalog.py`, requiere Python con `openpyxl` y recibe la ruta del archivo Excel como argumento. Las imágenes públicas y el JSON están incluidos en Git. Ninguna otra hoja del Excel se exporta.

La ficha usa Lucian #221 con barra de compra y selector de variantes, adaptada a una ficha ampliada con cierre visible. Los filtros usan #305, el menú #045 y las tarjetas de contenido bajo el catálogo #223. Se conservan los comentarios de licencia de sus componentes.

La marca visible es Proarquero, con el logo suministrado, fondos blancos y acentos azules. La tipografía usa la pila del sistema Apple: San Francisco cuando está instalada, con una fuente de sistema equivalente en otros equipos. El repositorio y el dominio se mantienen como `proarqueros`.
