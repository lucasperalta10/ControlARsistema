# 🗺️ Roadmap de Actualizaciones - ControlAR

**Sistema de Gestión para Victoria Productos Artesanales**  
*Documento de planificación evolutiva del sistema.*

---

## 📌 Visión General

El presente roadmap traza la hoja de ruta de evolución de **ControlAR**, pasando de ser un sistema puramente enfocado en stock y cálculo de costos/márgenes hacia una plataforma integral de gestión comercial ágil, adaptada a la dinámica de mostrador y producción artesanal.

---

## 🚀 Versión 1.1: Flexibilidad de Catálogo y Control de Vencimientos *(En Planificación)*

> **Objetivo:** Mejorar la precisión del catálogo y evitar pérdidas económicas por mercadería caducada en góndola.

### 1. Edición de Categoría en Productos *(Idea de la usuaria)*
* **Problema que resuelve:** Si al dar de alta un producto se asignó una categoría equivocada (o si la mercadería cambia de rubro), actualmente no se puede corregir sin eliminar el artículo.
* **Alcance:**
  * Selector desplegable en el formulario de edición de la ficha del producto ([DetalleProducto.jsx](file:///c:/Users/LP/Desktop/ControlAR/ControlARsistema/frontend/src/pages/DetalleProducto.jsx)).
  * Soporte para cambiar de categoría o quitarla (*"Sin categoría"*).
  * Opción de mantener el margen de ganancia actual o recalcular con el margen sugerido de la nueva categoría.
  * Registro de auditoría del cambio en la tabla de actividad.

### 2. Control de Vencimientos y Alertas de Caducidad *(Idea de la usuaria)*
* **Problema que resuelve:** Alimentos y conservas artesanales tienen fechas límite de comercialización; se necesita anticipar mermas y evitar vender mercadería vencida.
* **Alcance:**
  * Campo `fecha_vencimiento` (opcional/date) en productos perecederos.
  * Posibilidad de actualizar la fecha al ingresar reposición de stock.
  * **Semáforo visual:**
    * 🟢 **Vigente:** Con margen seguro de consumo.
    * 🟡 **Próximo a vencer:** Aviso preventivo a 15 y 30 días de caducar.
    * 🔴 **Vencido:** Caducado; aviso crítico.
  * Indicador de métricas en el **Inicio (Dashboard)** con acceso directo a artículos por vencer.
  * Nuevo filtro rápido en el catálogo de productos: chip `[Por vencer / Vencidos]`.
  * Motivo de baja rápida *"Vencimiento / Merma"* en el modal de salida de stock.

---

## 🌿 Versión 1.2: Herramientas de Mostrador y Exportación Comercial *(Propuesta del Asistente)*

> **Objetivo:** Facilitar la exhibición de precios físicos al cliente y el respaldo contable fuera del sistema.

### 3. Generador de Cartelería de Góndola y Listas de Precios Imprimibles (PDF/Excel)
* **Problema que resuelve:** Cuando varían costos o márgenes, actualizar las etiquetas de precios de los estantes o imprimir una lista para el mostrador suele hacerse a mano o en un archivo externo desactualizado.
* **Alcance:**
  * **Generador de Etiquetas de Góndola (PDF):** Con un clic, exportar una hoja lista para imprimir y recortar con nombre del producto, precio en formato `$ 15.000` y unidad de venta (ej: *$ 16/g* o *$ 4.500 c/u*).
  * **Lista de Precios al Público (PDF A4):** Planilla limpia y prolija con logo de Victoria Productos Artesanales, dividida por categorías, lista para tener impresa en el mostrador.
  * **Exportación de Inventario a Excel (.xlsx / .csv):** Descarga del inventario completo con stock actual, costo, margen y precio para control físico mensual o conciliación.

---

## 📈 Versión 1.3: Registro Rápido de Ventas y Balance Diario de Caja *(Propuesta del Asistente)*

> **Objetivo:** Conocer con exactitud cuánto dinero ingresó en la jornada y cuál fue la ganancia neta real del negocio.

### 4. Modo Venta Rápida en Mostrador y Reporte de Ganancia Diaria
* **Problema que resuelve:** Actualmente las salidas de stock reducen la cantidad pero no calculan el monto cobrado ni la rentabilidad neta acumulada en el día.
* **Alcance:**
  * **Mostrador Ágil / Carrito Express:** Selector táctil para sumar 1 o varios productos vendidos, ingresar el medio de pago (*Efectivo*, *Transferencia/Mercado Pago*, *Tarjeta*) y confirmar en un solo toque (descontando el stock automáticamente).
  * **Cierre de Caja del Día:**
    * Total recaudado en pesos ($).
    * Desglose por método de pago.
    * **Ganancia Real del Día:** $\sum (\text{Precio cobrado} - \text{Costo del producto})$, mostrando la utilidad neta exacta generada por las ventas de la jornada.
  * Historial de cierres de caja accesible desde el panel de administración.

---

## 🔮 Versión 2.0: Automatización y Escaneo *(Futuro)*

* **Escáner de Código de Barras con la cámara del celular:** Uso de la cámara de la PWA para escanear productos y realizar salidas o reposiciones al instante sin teclear.
* **Notificaciones Web Push PWA:** Avisos matutinos en el teléfono sobre productos que entraron en fase crítica de vencimiento o reposición.

---

## 📊 Matriz de Prioridad y Esfuerzo

| Versión | Funcionalidad | Origen | Prioridad | Impacto | Complejidad |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **v1.1** | Edición de Categoría | Usuaria | 🔴 Alta | Alto | Baja |
| **v1.1** | Control de Vencimientos | Usuaria | 🔴 Alta | Muy Alto | Media |
| **v1.2** | Etiquetas de Góndola y Exportación PDF/Excel | Propuesta | 🟡 Media | Alto | Media |
| **v1.3** | Venta Rápida y Ganancia Diaria de Caja | Propuesta | 🟡 Media | Muy Alto | Media-Alta |
| **v2.0** | Escaneo con Cámara PWA | Futuro | 🟢 Baja | Medio | Media |
