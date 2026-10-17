# Catálogo Rinat Argentina

Fuente solicitada: https://www.rinatargentina.ar/ (importación 17/10/2026 UTC).

Se contrastó el sitemap con las cuatro páginas del catálogo: 37 productos únicos,
202 combinaciones publicadas y 188 fotos de galería descargadas y verificadas como
imágenes. El mapa de cada URL original a su archivo local y dimensiones está en
`asset-map.json`. Las fotos se guardan por producto en `public/sites/rinat/products/`.

Los colores y talles se obtienen del atributo público `data-variants` de cada ficha,
sin formar combinaciones cartesianas inventadas. La relación de color con imagen
proviene del identificador de imagen de cada variante. Se conservaron también
precio, SKU (cuando existe), stock/disponibilidad de la fuente, descripción y URL.

Los 37 productos Rinat se agregan a los 198 del Excel: no se reemplazan modelos de
otras marcas con imágenes Rinat. Las fotos ilustrativas del catálogo anterior
siguen identificadas como tales. No se importan políticas de envío, contactos,
cuentas, carritos ni condiciones comerciales de Rinat como propias de Proarquero.

El stock local sigue configurado en ocho unidades por producto según lo pedido
por el usuario; no es sincronización de inventario con Rinat. `sourceStock` y
`sourceAvailable` son evidencia de la fuente al importar, no inventario propio.
Las cuotas de la fuente se guardan como evidencia sin ofrecerlas automáticamente
en Proarquero. Los precios Rinat son una captura de los publicados al importar.

Los colores se seleccionan mediante sus fotos originales; luego se muestran sólo
los talles de ese color. Cambiar de color actualiza la foto principal y anula el
talle anterior. El carrito conserva la foto, color, talle y precio de la variante.
Las fuentes SF Pro siguen en la pila nativa de Apple; el usuario indicó que
adjuntará el archivo autorizado para web. No se distribuyen archivos SF ajenos.

Actualizar desde la fuente con Python + Pillow: `python scripts/import-rinat-catalog.py --refresh`.
Sin `--refresh`, se reutiliza el HTML descargado para pruebas reproducibles.
Verificar archivos y relaciones: `node scripts/verify-rinat-catalog.mjs`.
El HTML público se cachea en `outputs/rinat-cache/` (ignorado por Git).

La portada presenta hasta seis productos por categoría en este orden: Guantes,
Pelotas, Indumentaria, Accesorios, Calzado. “Ver todo” expande cada serie sin perder
el acceso a las demás. Los filtros/búsqueda permiten consultar los 235 productos.
