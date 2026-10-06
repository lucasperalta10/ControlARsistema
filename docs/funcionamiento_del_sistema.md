# Guía Integral de Arquitectura y Funcionamiento de ControlAR

**Versión del Sistema:** 1.0.1  
**Año:** 2026  
**Desarrollador:** Lucas  
**Negocio de Referencia:** Victoria Productos Artesanales  

---

## 1. Introducción y Propósito

**ControlAR** es un sistema de gestión comercial enfocado en resolver de forma ágil, intuitiva y precisa el control de mercadería en negocios pequeños y familiares.

El sistema fue concebido bajo dos premisas fundamentales:
1. **Simplicidad operativa:** Diseñado para usuarios sin formación técnica que gestionan el negocio día a día, principalmente a través del teléfono celular o una computadora en el mostrador.
2. **Rigor matemático y de datos:** Ningún cálculo crítico (precios, márgenes ni movimientos de stock) queda a merced de manipulaciones manuales en el navegador. El backend es la única fuente de verdad.

---

## 2. Arquitectura General del Sistema

El sistema implementa una arquitectura desacoplada de 3 capas, optimizada para desplegarse de manera independiente y económica:

```text
       📱 Teléfono Celular (PWA)         💻 Computadora / Mostrador (1920x1080)
                     │                                  │
                     └─────────────────┬────────────────┘
                                       │
                               HTTPS / JSON REST API
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │     Node.js + Express API    │
                       │     (Alojado en Railway)     │
                       └──────────────┬───────────────┘
                                      │
                               Conexión Pool
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │       Base de Datos MySQL    │
                       │       (controlar_db)         │
                       └──────────────────────────────┘
```

* **Frontend:** Desarrollado en **React + Vite**, configurado como **Progressive Web App (PWA)** instalable con Service Worker y Web Manifest.
* **Backend:** API REST en **Node.js** con **Express.js**, modularizado en rutas, controladores, servicios y middlewares de seguridad.
* **Base de Datos:** **MySQL 8.0** relacional con soporte transaccional para atomicidad en movimientos de stock. Incluye un adaptador con fallback SQLite para desarrollo local offline.

---

## 3. Seguridad y Roles de Usuario

El sistema no cuenta con registro público; los accesos son controlados internamente por la administración.

### Mecanismo de Autenticación
* **Identificación:** Número de DNI + PIN numérico de acceso (de 4 a 8 dígitos).
* **Almacenamiento Seguro:** Los PINs se almacenan exclusivamente como hashes criptográficos calculados mediante `bcryptjs` con 10 rondas de salt. **Nunca se guardan ni viajan en texto plano.**
* **Tokens de Sesión:** Tras validar las credenciales, el servidor emite un token **JWT (JSON Web Token)** con expiración que el cliente adjunta en cada solicitud mediante el encabezado `Authorization: Bearer <token>`.

### Roles del Sistema

| Rol | Alcance y Permisos |
| :--- | :--- |
| **`USUARIO`** | Operador habitual del negocio. Puede consultar productos, dar de alta nuevos artículos, editar información comercial, realizar movimientos de stock (Entradas, Salidas, Ajustes), ver listas de reposición, consultar categorías y cambiar su propio PIN. |
| **`SUPER_ADMIN`** | Administrador del sistema. Posee todos los permisos de `USUARIO` y suma: gestión total de cuentas de usuario, reseteo forzado de PINs, activación/desactivación de cuentas, creación y edición de categorías, consulta de registros de auditoría y diagnóstico del estado de la base de datos y la API. |

---

## 4. Regla Oficial de Cálculo de Precios y Fraccionados

### La Fórmula de Góndola
En ControlAR, el precio al público no se calcula multiplicando arbitrariamente por un factor (ej: *Costo × 1.50* no equivale a un margen del 50%). Se utiliza la fórmula oficial de margen comercial:

$$\boxed{\text{Precio de góndola} = \frac{\text{Costo real}}{1 - \left(\frac{\text{Margen}}{100}\right)}}$$

#### Ejemplos Prácticos:
* **Costo Real:** $\$10.000$ | **Margen:** $50\%$
  $$\text{Precio} = \frac{10.000}{1 - 0.50} = \frac{10.000}{0.50} = \mathbf{\$20.000}$$
  *(Ganancia: $\$10.000$ sobre el precio final de venta $\rightarrow 50\%$).*

* **Costo Real:** $\$10.000$ | **Margen:** $60\%$
  $$\text{Precio} = \frac{10.000}{1 - 0.60} = \frac{10.000}{0.40} = \mathbf{\$25.000}$$

#### Validaciones del Backend:
* Margen mínimo: $0\%$ (se vende al costo).
* Margen máximo permitido: $99.99\%$ (un margen de $100\%$ provocaría división por cero).
* Costo real $\ge 0$.

### Productos Fraccionados
Negocios como despensas suelen comprar paquetes cerrados (ej: una bolsa de frutos secos de $400\text{ g}$ a $\$4.000$) y venderlos fraccionados por gramos.
1. La aplicación incluye un **asistente de fraccionado** en la carga de producto donde el usuario ingresa el costo del paquete y su contenido.
2. El sistema calcula automáticamente el costo unitario por gramo ($\$4.000 / 400 = \$10/\text{g}$).
3. Aplicando el margen correspondiente ($60\%$), el precio de góndola resulta en $\$25$ por gramo, permitiendo registrar salidas fraccionadas exactas ($50\text{ g}$, $120\text{ g}$, etc.).

---

## 5. Gestión de Stock y Movimientos Atómicos

Para garantizar la integridad y auditoría del inventario, rige una **regla fundamental**:

> **Prohibido modificar el stock actual mediante la edición general del producto.**

Toda alteración del stock físico pasa obligatoriamente por una de las siguientes tres operaciones atómicas:

1. **ENTRADA (`+`):** Incrementa el stock por recepción de mercadería o compra a proveedor.
2. **SALIDA (`-`):** Reduce el stock por venta cotidiana o retiro de mercadería. El backend valida estrictamente que **no se permita stock negativo** ($\text{stock\_actual} - \text{cantidad} \ge 0$).
3. **AJUSTE (`=`):** Modifica el stock directamente al valor registrado durante un conteo físico de góndola para corregir mermas, roturas o desajustes.

Cada operación genera un registro inmutable en la tabla `movimientos_stock` con:
* Producto afectado.
* Operador responsable (usuario autenticado).
* Tipo de movimiento (`ENTRADA`, `SALIDA`, `AJUSTE`).
* Cantidad operada.
* Stock anterior y stock resultante.
* Motivo o comentario aclaratorio.
* Marca temporal (`creado_en`).

### Estados Automáticos del Stock
* $\text{Stock} = 0 \rightarrow$ <span style="color:#ef4444; font-weight:bold;">AGOTADO</span>
* $0 < \text{Stock} \le \text{Stock Mínimo} \rightarrow$ <span style="color:#f59e0b; font-weight:bold;">REPONER</span>
* $\text{Stock} > \text{Stock Mínimo} \rightarrow$ <span style="color:#10b981; font-weight:bold;">DISPONIBLE</span>

---

## 6. Módulos y Pantallas del Sistema

### 🏠 1. Inicio (Dashboard)
* **Saludo personalizado:** Saluda a la operadora/operador en turno.
* **Métricas Principales:** Tarjetas dinámicas con conteo de productos totales, productos en nivel de reposición y artículos agotados. Al hacer clic filtran directamente el catálogo.
* **Acceso Rápido:** Botón destacado `+ AGREGAR PRODUCTO`.
* **Buscador Universal:** Permite localizar cualquier artículo escribiendo parte de su nombre.
* **Lista Prioritaria de Reposición:** Muestra en primer plano los productos que requieren compra urgente.

### 📦 2. Productos (Catálogo)
* Consulta general del inventario con buscador en tiempo real.
* Filtros rápidos mediante chips: *Todos*, *Disponibles*, *Reponer*, *Agotados*.
* Selector de categorías para acotar la búsqueda.
* Tarjetas interactivas con nombre, categoría, stock formateado en su unidad de venta, precio de góndola en pesos argentinos y badge de estado.

### ➕ 3. Agregar Producto
* Formulario estructurado en 3 pasos:
  1. **Información:** Nombre, Categoría opcional y Unidad de venta (`Unidad`, `Gramo`, `Kilogramo`, `Mililitro`, `Litro`).
  2. **Costos y Margen:** Precio de compra, costo real y margen con accesos rápidos a porcentajes comunes ($35\%$, $40\%$, $50\%$, $60\%$).
  3. **Control de Stock:** Cantidad inicial y stock mínimo de aviso.
* **Simulador de Precio de Góndola en Vivo:** Tarjeta destacada que recalcula y muestra el precio final en tiempo real mientras el usuario escribe los números.

### 🔍 4. Detalle de Producto
* Ficha técnica completa de la mercadería con costos, márgenes e información impositiva/góndola.
* Botones táctiles directos para registrar **Salida**, **Entrada** o **Ajuste** de stock en un solo toque mediante un modal numérico.
* Edición de información del producto (sin alterar stock).
* Desactivación lógica (*soft delete*, conservando el historial).
* Historial cronológico detallado de todos los movimientos sufridos por el artículo.

### ⚠️ 5. Reponer
* Vista especializada dividida en dos secciones: **Agotados** (urgencia máxima) y **Bajo Stock**.
* Cada producto cuenta con un botón directo `+ Reponer` para cargar ingresos de mercadería sin tener que entrar a la ficha individual.

### 👤 6. Mi Cuenta
* Ficha del usuario actual con DNI parcialmente oculto (ej: `12••••678`).
* Formulario seguro para que la operadora o administrador cambie su propio PIN de acceso.
* Botón de cierre de sesión seguro.

### ℹ️ 7. Acerca de
* Datos institucionales del sistema, versión, año y desarrollador.
* Ficha de *Victoria Productos Artesanales* con placeholders gráficos preparados para la inserción de logotipos oficiales.

### 🛡️ 8. Panel de Administración (`SUPER_ADMIN`)
* **Usuarios:** Alta de operadores, reseteo de claves, activación/desactivación y asignación de roles.
* **Categorías:** Creación y mantenimiento de categorías comerciales con sus márgenes sugeridos por defecto.
* **Actividad:** Log de auditoría que registra logins, modificaciones de artículos y ajustes de stock con fecha y responsable.
* **Sistema:** Monitor de salud de la API, estado y latencia de conexión a MySQL, conteos globales y tiempo de actividad (*uptime*).

---

## 7. Diseño Adaptativo y Responsive (v1.0.1)

El sistema implementa una arquitectura visual verdaderamente adaptativa:

```text
┌─────────────────────────────────┬─────────────────────────────────┐
│     En Celulares (<= 767px)     │     En Computadoras (>= 768px)  │
├─────────────────────────────────┼─────────────────────────────────┤
│ • Ancho contenido: 100%         │ • Ancho contenido: hasta 1620px │
│ • Barra inferior fija (pulgar)  │ • Barra de navegación superior  │
│ • Catálogo en 1 columna         │ • Catálogo en 3 y 4 columnas    │
│ • Detalle en 1 columna vertical │ • Detalle en 2 columnas lado a  │
│ • Formulario en 1 columna       │   lado (Ficha vs Historial)     │
│                                 │ • Login centrado tipo tarjeta   │
└─────────────────────────────────┴─────────────────────────────────┘
```

* **Resolución Full HD (1920x1080):** En monitores de escritorio panorámicos el contenido se expande ergonómicamente hasta `1620px` sin dejar vacíos desproporcionados, organizando el catálogo en 4 columnas y los formularios en 2 columnas balanceadas.

---

## 8. Esquema de Base de Datos (MySQL)

```sql
-- Tablas principales y sus relaciones:
categorias (id, nombre, margen_predeterminado, activo, creado_en, actualizado_en)
    │
    └──< productos (id, nombre, categoria_id, unidad_venta, precio_compra, costo_real,
                    margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo...)
              │
              └──< movimientos_stock (id, producto_id, usuario_id, tipo, cantidad,
                                      stock_anterior, stock_nuevo, motivo, creado_en)
usuarios (id, dni, nombre, apellido, pin_hash, rol, activo, ultimo_acceso...) ───┘
    │
    └──< actividad (id, usuario_id, accion, entidad, entidad_id, descripcion, creado_en)
```

---

## 9. Despliegue e Infraestructura Prevista

### Frontend en Vercel
1. Conectar el repositorio de GitHub.
2. Configurar la carpeta raíz en `frontend`.
3. Variable de entorno: `VITE_API_URL=https://tu-backend-railway.app/api`.
4. El comando de build es `npm run build` con salida en `dist`.

### Backend en Railway
1. Crear un proyecto con una base de datos MySQL administrada.
2. Conectar el servicio Node.js apuntando al directorio `backend`.
3. Cargar las variables de entorno:
   * `PORT`: Asignado por Railway.
   * `DB_HOST`: Host de MySQL Railway (`MYSQLHOST`).
   * `DB_PORT`: Puerto de MySQL Railway (`MYSQLPORT`).
   * `DB_USER`: Usuario MySQL (`MYSQLUSER`).
   * `DB_PASSWORD`: Clave MySQL (`MYSQLPASSWORD`).
   * `DB_NAME`: Base de datos MySQL (`MYSQLDATABASE`).
   * `JWT_SECRET`: Clave privada para firma de tokens.
   * `CORS_ORIGIN`: URL pública de tu frontend en Vercel.
4. Inicializar las tablas ejecutando [schema.sql](file:///c:/Users/SP/Desktop/ControlAR/backend/schema.sql).
