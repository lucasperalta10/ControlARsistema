# ControlAR v1.0

## Documento Técnico y Especificación Funcional

**Sistema de gestión para Victoria Productos Artesanales**

**Estado:** Especificación definitiva para MVP
**Versión:** 1.0.0
**Año:** 2026
**Desarrollador:** Lucas

---

# 1. Descripción del proyecto

**ControlAR** es un sistema de gestión diseñado inicialmente para **Victoria Productos Artesanales**, una despensa/negocio familiar.

Su objetivo principal es facilitar el control cotidiano del negocio mediante una aplicación web progresiva (PWA), optimizada para teléfonos celulares.

El sistema debe permitir controlar:

* Productos.
* Stock disponible.
* Productos con poco stock.
* Productos agotados.
* Costos reales.
* Márgenes de ganancia.
* Precios de góndola.
* Movimientos de stock.
* Usuarios y permisos.
* Historial de actividades.

El sistema debe ser sencillo de utilizar para una persona que no tiene experiencia técnica y que utilizará principalmente un teléfono celular.

ControlAR debe priorizar **simplicidad, claridad y rapidez** sobre la cantidad de funciones.

---

# 2. Objetivo principal

ControlAR debe responder rápidamente estas preguntas:

1. ¿Qué productos tengo?
2. ¿Cuánto stock tengo?
3. ¿Qué productos necesitan reposición?
4. ¿Qué productos están agotados?
5. ¿Cuál es el costo real de cada producto?
6. ¿Qué margen de ganancia tiene cada producto?
7. ¿Cuál debería ser su precio de góndola?

---

# 3. Principios de diseño

El sistema debe seguir estos principios:

* Mobile-first.
* Interfaz sencilla.
* Botones grandes y claros.
* Poco texto técnico.
* Formularios simples.
* Navegación intuitiva.
* Información importante visible rápidamente.
* Evitar cálculos manuales por parte del usuario.
* Evitar funcionalidades innecesarias en el MVP.
* Preparar la arquitectura para futuras ampliaciones.

El sistema debe sentirse como una aplicación móvil aunque técnicamente sea una PWA.

---

# 4. Tecnologías

## Frontend

* React
* Vite
* JavaScript
* CSS
* PWA

## Backend

* Node.js
* Express.js
* API REST

## Base de datos

* MySQL

## Autenticación

* Sesiones/token de autenticación.
* PIN almacenado mediante hash seguro.
* Nunca almacenar PIN en texto plano.

## Producción prevista

Frontend:

* Vercel

Backend:

* Railway

Base de datos:

* MySQL administrado mediante el entorno de producción correspondiente.

La arquitectura debe permitir posteriormente migrar a otra infraestructura sin modificar la lógica principal de la aplicación.

---

# 5. Arquitectura general

```text
                 📱 Usuario
                     │
                     ▼
              ┌─────────────┐
              │   ControlAR │
              │     PWA     │
              └──────┬──────┘
                     │
                  REST API
                     │
                     ▼
              ┌─────────────┐
              │ Node/Express│
              │   Backend   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │    MySQL    │
              └─────────────┘
```

El frontend nunca debe acceder directamente a MySQL.

Todas las operaciones deben pasar por el backend.

---

# 6. PWA

ControlAR debe ser una PWA desde la primera versión.

Requisitos:

* Manifest.
* Service Worker.
* Iconos.
* Nombre de aplicación: ControlAR.
* Instalación desde el navegador.
* Funcionamiento adaptado a pantalla móvil.
* Acceso mediante icono en pantalla de inicio.
* Diseño responsive.

La aplicación debe poder instalarse en el teléfono de la usuaria para que pueda abrirla como una aplicación convencional.

El sistema no debe depender de que la usuaria escriba manualmente la URL cada vez.

---

# 7. Usuarios y roles

ControlAR tendrá inicialmente dos roles.

## USUARIO

Usuario normal del negocio.

Puede:

* Iniciar sesión.
* Ver productos.
* Crear productos.
* Editar productos.
* Desactivar productos.
* Gestionar stock.
* Ver productos para reponer.
* Ver movimientos de stock.
* Ver categorías.
* Cambiar su propio PIN.

## SUPER_ADMIN

Usuario con permisos administrativos.

Puede realizar todas las acciones de un usuario normal y además:

* Crear usuarios.
* Editar usuarios.
* Activar/desactivar usuarios.
* Resetear PIN.
* Administrar categorías.
* Ver actividad del sistema.
* Ver movimientos.
* Consultar estado del sistema.
* Corregir información del sistema.
* Realizar tareas de mantenimiento.

El rol debe ser validado en el backend.

Ocultar botones en el frontend NO es suficiente como mecanismo de seguridad.

---

# 8. Autenticación

No habrá registro público.

Las cuentas serán creadas inicialmente desde la base de datos y posteriormente podrán ser administradas por el SUPER_ADMIN.

Inicio de sesión:

* DNI.
* PIN.

Ejemplo:

```json
{
  "dni": "12345678",
  "pin": "1234"
}
```

El PIN debe almacenarse mediante un algoritmo de hash seguro.

Nunca devolver el PIN mediante la API.

Debe existir:

* Login.
* Logout.
* Sesión autenticada.
* Verificación de usuario actual.
* Cambio de PIN.
* Reset de PIN por SUPER_ADMIN.

---

# 9. Menú principal

La navegación principal debe incluir:

* 🏠 Inicio
* 📦 Productos
* ➕ Agregar
* ⚠️ Reponer
* ℹ️ Acerca de
* 👤 Mi cuenta

La navegación debe ser especialmente cómoda en teléfonos.

---

# 10. Pantalla de Inicio

El Dashboard debe mostrar de forma rápida:

* Saludo al usuario.
* Cantidad de productos disponibles.
* Cantidad de productos para reponer.
* Cantidad de productos agotados.
* Botón grande para agregar producto.
* Buscador.
* Lista de productos que necesitan reposición.

Ejemplo conceptual:

```text
Hola, María 👋

Productos
[ 35 ]

Para reponer
[ 6 ]

Agotados
[ 2 ]

[ + AGREGAR PRODUCTO ]

⚠️ Necesitan reposición

Snack X       120 g
Jugo X        2 unidades
Yogur X       1 unidad
```

---

# 11. Productos

Debe existir una pantalla donde se puedan consultar todos los productos.

Funciones:

* Buscar por nombre.
* Filtrar por estado.
* Filtrar por categoría.

Filtros:

* Todos.
* Disponibles.
* Reponer.
* Agotados.

Cada producto debe mostrar como mínimo:

* Nombre.
* Categoría.
* Stock.
* Unidad de venta.
* Precio de góndola.
* Estado del stock.

---

# 12. Categorías

Las categorías son opcionales.

Ejemplos actuales:

* Snacks.
* Jugos.
* Limpieza.
* Bebidas.
* Golosinas.
* Congelados.
* Yogures.
* Otros.

Una categoría no debe determinar obligatoriamente la unidad de venta.

La unidad de venta pertenece al producto.

Las categorías podrán utilizarse posteriormente para establecer valores predeterminados de margen.

---

# 13. Unidades de venta

Cada producto debe definir su propia unidad de venta.

Unidades iniciales:

* Unidad.
* Gramo.
* Kilogramo.
* Mililitro.
* Litro.

Ejemplos:

```text
Snack → Gramo
Jugo → Unidad
Limpieza → Unidad
Bebida → Unidad
Golosina → Unidad
Congelado → Kilogramo
Yogur → Unidad
```

No se deben crear reglas rígidas como:

```text
Si categoría = Snacks → gramos
```

La categoría puede sugerir una configuración, pero el producto debe poder definirla.

---

# 14. Productos fraccionados

Algunos productos se compran en una presentación determinada pero se venden fraccionados.

Ejemplo:

Una bolsa de snack contiene:

```text
400 gramos
```

La bolsa no se vende completa.

Se vende por gramos.

Por lo tanto, ControlAR debe poder manejar:

```text
Producto: Snack
Stock: 400 g
Unidad de venta: Gramo
```

Si se venden 100 g:

```text
400 g → 300 g
```

El movimiento debe quedar registrado.

---

# 15. Productos vendidos por unidad

Otros productos se venden individualmente.

Ejemplo:

```text
Jugo
Stock: 20 unidades
```

Una venta:

```text
20 → 19 unidades
```

El mismo concepto se aplica a:

* Bebidas.
* Limpieza.
* Golosinas.
* Yogures.
* Otros productos vendidos por unidad.

---

# 16. Productos por peso

Los congelados pueden manejarse por kilogramo.

Ejemplo:

```text
Producto: Congelado X
Stock: 5 kg
Unidad: Kilogramo
```

Si se retiran 1,5 kg:

```text
5 kg → 3,5 kg
```

El sistema debe permitir cantidades decimales cuando la unidad lo requiera.

---

# 17. Costo real

El sistema debe diferenciar entre:

### Precio de compra

Lo que el negocio pagó por adquirir el producto.

### Costo real

Costo utilizado para determinar el precio de venta.

En la primera versión, para mantener el sistema sencillo, normalmente:

```text
Costo real = Precio de compra
```

Sin embargo, la arquitectura debe permitir posteriormente incorporar otros costos si fueran necesarios.

No se implementará inicialmente un sistema complejo de compras, proveedores o distribución de gastos.

---

# 18. Margen de ganancia

Cada producto debe poder tener un margen de ganancia independiente.

No debe existir un único margen obligatorio para todo el negocio.

Ejemplo:

```text
Snack → 60%
Limpieza → 35%
Bebidas → 40%
Otro producto → 50%
```

El margen debe almacenarse asociado al producto.

La categoría podrá tener en el futuro un margen predeterminado que se utilice como sugerencia al crear productos.

El margen de categoría no debe sobrescribir obligatoriamente el margen específico del producto.

---

# 19. Cálculo del precio de góndola

La fórmula oficial de ControlAR será:

```text
Precio de mostrador / góndola =
Costo real × (1 + Margen / 100)
```

El margen representa un recargo sobre el costo.

Ejemplo:

```text
Costo real = $10.000
Margen = 50%

Precio =
10.000 × (1 + 0,50)

Precio = $15.000
```

Otro ejemplo:

```text
Costo real = $10.000
Margen = 60%

Precio =
10.000 × (1 + 0,60)

Precio = $16.000
```

Importante:

**No utilizar:**

```text
Costo × 1,50
```

como sustituto del margen del 50%.

La fórmula de margen debe respetarse exactamente.

---

# 20. Precio por unidad de venta

Cuando el producto sea fraccionado, ControlAR debe calcular el costo correspondiente a su unidad de venta.

Ejemplo:

```text
Bolsa de snack:
400 g
Costo real:
$4.000
```

Costo por gramo:

```text
$4.000 / 400 = $10 por gramo
```

Con recargo del 60%:

```text
$10 × (1 + 0,60) = $16 por gramo
```

Por lo tanto:

```text
50 g  → $800
100 g → $1.600
150 g → $2.400
```

La arquitectura debe permitir este comportamiento sin necesidad de crear un producto diferente para cada cantidad.

---

# 21. Carga de producto

Formulario inicial:

### Información

* Nombre.
* Categoría opcional.
* Unidad de venta.

### Costos

* Precio de compra.
* Costo real.

### Precio

* Margen de ganancia.
* Precio de góndola calculado automáticamente.

### Stock

* Cantidad inicial.
* Stock mínimo.

El usuario debe ver el precio calculado antes de guardar.

El precio de góndola debe calcularse en backend y también puede mostrarse previamente en frontend para mejorar la experiencia.

El backend es la fuente de verdad.

---

# 22. Stock

Cada producto tendrá:

* Stock actual.
* Stock mínimo.
* Unidad de venta.

Estados:

```text
stock = 0
→ AGOTADO

stock <= stock_minimo
→ REPONER

stock > stock_minimo
→ DISPONIBLE
```

Ejemplo:

```text
Stock actual: 2
Stock mínimo: 3

Estado:
REPONER
```

---

# 23. Modificación del stock

El stock NO debe modificarse directamente mediante la edición general del producto.

Debe utilizarse un sistema de movimientos.

### Entrada

Aumenta el stock.

```text
+10 unidades
```

### Salida

Reduce el stock.

```text
-1 unidad
```

### Ajuste

Permite corregir el stock físico.

Ejemplo:

```text
Stock registrado: 15
Stock físico real: 13

Ajuste:
15 → 13
```

Cada movimiento debe quedar registrado.

---

# 24. Historial de stock

Cada movimiento debe registrar:

* Producto.
* Usuario.
* Tipo de movimiento.
* Cantidad.
* Stock anterior.
* Stock nuevo.
* Motivo.
* Fecha y hora.

Tipos:

* ENTRADA.
* SALIDA.
* AJUSTE.

Ejemplo:

```text
Producto: Snack X
Tipo: SALIDA
Cantidad: 100 g
Stock anterior: 400 g
Stock nuevo: 300 g
Usuario: María
Motivo: Venta
Fecha: 05/10/2026
```

---

# 25. Pantalla Reponer

Debe mostrar automáticamente:

### Agotados

Productos con:

```text
stock = 0
```

### Bajo stock

Productos con:

```text
stock <= stock_minimo
```

Al seleccionar un producto se debe poder acceder a su detalle.

---

# 26. Detalle de producto

Debe mostrar:

* Nombre.
* Categoría.
* Unidad de venta.
* Stock actual.
* Stock mínimo.
* Precio de compra.
* Costo real.
* Margen.
* Precio de góndola.
* Estado.

Acciones:

* * Entrada.
* * Salida.
* Ajustar stock.
* Editar.
* Desactivar.
* Ver movimientos.

---

# 27. Eliminación de productos

Los productos no deben eliminarse físicamente de la base de datos en condiciones normales.

Se utilizará desactivación lógica:

```text
activo = false
```

Esto permite conservar:

* Historial.
* Movimientos.
* Auditoría.

Los productos inactivos no deben aparecer en la lista normal de productos.

---

# 28. Base de datos

## Tabla: usuarios

```text
id
dni
nombre
apellido
pin_hash
rol
activo
ultimo_acceso
creado_en
actualizado_en
```

`dni` debe ser único.

Roles:

```text
USUARIO
SUPER_ADMIN
```

---

## Tabla: categorias

```text
id
nombre
margen_predeterminado
activo
creado_en
actualizado_en
```

`margen_predeterminado` puede ser NULL.

La utilización de este campo debe considerarse una ayuda para cargar productos, no una regla obligatoria.

---

## Tabla: productos

```text
id
nombre
categoria_id
unidad_venta
precio_compra
costo_real
margen_ganancia
precio_gondola
stock_actual
stock_minimo
activo
creado_en
actualizado_en
```

`categoria_id` puede ser NULL.

El precio de góndola debe calcularse utilizando:

```text
precio_gondola =
costo_real * (1 + margen_ganancia / 100)
```

El backend debe validar los datos.

---

## Tabla: movimientos_stock

```text
id
producto_id
usuario_id
tipo
cantidad
stock_anterior
stock_nuevo
motivo
creado_en
```

Tipos:

```text
ENTRADA
SALIDA
AJUSTE
```

---

## Tabla: actividad

```text
id
usuario_id
accion
entidad
entidad_id
descripcion
creado_en
```

Debe registrar acciones importantes.

Ejemplos:

```text
LOGIN
CREAR_PRODUCTO
EDITAR_PRODUCTO
DESACTIVAR_PRODUCTO
CREAR_CATEGORIA
EDITAR_USUARIO
RESET_PIN
```

---

# 29. Relaciones

```text
categorias
    │
    └──────< productos
                    │
                    └──────< movimientos_stock
                                      │
usuarios ─────────────────────────────┘

usuarios
    │
    └──────< actividad
```

Los productos pertenecen al negocio, no a un usuario individual.

Los usuarios son operadores del sistema.

---

# 30. API REST

Base:

```text
/api
```

## Autenticación

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/pin
```

## Productos

```text
GET    /api/productos
GET    /api/productos/:id
POST   /api/productos
PUT    /api/productos/:id
DELETE /api/productos/:id
```

Filtros posibles:

```text
?estado=agotado
?estado=reponer
?categoria=2
?buscar=snack
```

## Stock

```text
POST /api/stock/:productoId/entrada
POST /api/stock/:productoId/salida
POST /api/stock/:productoId/ajuste
GET  /api/stock/reponer
GET  /api/productos/:id/movimientos
```

## Categorías

```text
GET    /api/categorias
POST   /api/categorias
PUT    /api/categorias/:id
DELETE /api/categorias/:id
```

Crear, editar y desactivar categorías requiere SUPER_ADMIN.

## Usuarios

```text
GET   /api/usuarios
GET   /api/usuarios/:id
POST  /api/usuarios
PUT   /api/usuarios/:id
PATCH /api/usuarios/:id/estado
POST  /api/usuarios/:id/reset-pin
```

Requiere SUPER_ADMIN.

## Actividad

```text
GET /api/actividad
```

Requiere SUPER_ADMIN.

## Sistema

```text
GET /api/sistema/estado
```

Requiere SUPER_ADMIN.

---

# 31. Reglas importantes del backend

El backend debe ser responsable de las reglas críticas.

Nunca confiar exclusivamente en el frontend para:

* Permisos.
* Roles.
* Cálculo del precio.
* Modificación de stock.
* Validación de cantidades.
* Validación de márgenes.

Ejemplo:

El frontend puede enviar:

```json
{
  "precioCompra": 10000,
  "costoReal": 10000,
  "margen": 50
}
```

Pero el backend debe validar y calcular:

```text
precio_gondola = costo_real * (1 + margen / 100)
```

El cliente no debe poder enviar arbitrariamente un precio final para saltarse la lógica.

---

# 32. Reglas de stock

Nunca modificar:

```text
stock_actual
```

mediante una edición general de producto.

Todo cambio debe pasar por:

```text
ENTRADA
SALIDA
AJUSTE
```

Cada operación debe generar un registro en `movimientos_stock`.

Las operaciones de stock deben ser atómicas para evitar inconsistencias.

No permitir stock negativo salvo que una futura decisión del negocio lo habilite explícitamente.

---

# 33. Permisos

| Acción                      | USUARIO | SUPER_ADMIN |
| --------------------------- | ------: | ----------: |
| Iniciar sesión              |       ✅ |           ✅ |
| Ver productos               |       ✅ |           ✅ |
| Crear productos             |       ✅ |           ✅ |
| Editar productos            |       ✅ |           ✅ |
| Desactivar productos        |       ✅ |           ✅ |
| Modificar stock             |       ✅ |           ✅ |
| Ver reposición              |       ✅ |           ✅ |
| Ver movimientos             |       ✅ |           ✅ |
| Ver categorías              |       ✅ |           ✅ |
| Crear categorías            |       ❌ |           ✅ |
| Editar categorías           |       ❌ |           ✅ |
| Desactivar categorías       |       ❌ |           ✅ |
| Ver usuarios                |       ❌ |           ✅ |
| Crear usuarios              |       ❌ |           ✅ |
| Editar usuarios             |       ❌ |           ✅ |
| Activar/desactivar usuarios |       ❌ |           ✅ |
| Resetear PIN                |       ❌ |           ✅ |
| Ver actividad               |       ❌ |           ✅ |
| Ver estado del sistema      |       ❌ |           ✅ |

---

# 34. Mi cuenta

Debe mostrar:

* Nombre.
* Apellido.
* DNI parcialmente oculto.
* Rol.
* Opción para cambiar PIN.
* Cerrar sesión.

El usuario normal solamente puede modificar su propio PIN.

---

# 35. Super Admin

Debe existir una sección administrativa separada.

Funciones iniciales:

### Usuarios

* Ver usuarios.
* Crear usuario.
* Editar usuario.
* Activar/desactivar.
* Resetear PIN.
* Ver rol.

### Categorías

* Crear.
* Editar.
* Desactivar.

### Actividad

* Consultar acciones importantes.

### Sistema

* Estado de API.
* Estado de base de datos.
* Información básica del sistema.

El diseño administrativo puede ser más funcional que el diseño destinado a la usuaria principal.

---

# 36. Acerca de

El menú principal debe incluir una sección **Acerca de**.

Debe mostrar:

### ControlAR

* Logo de ControlAR.
* Nombre.
* Descripción breve.
* Versión.
* Desarrollador.
* Año.

### Victoria Productos Artesanales

* Logo del negocio.
* Nombre del negocio.

Los logotipos se definirán posteriormente.

No deben inventarse logotipos durante la implementación.

La sección debe estar preparada para incorporar los recursos gráficos cuando sean definidos.

Ejemplo:

```text
             [LOGO CONTROLAR]

                ControlAR
       Sistema de gestión para
       Victoria Productos Artesanales

              Versión 1.0.0

          Desarrollado por
             Lucas

                Año 2026


       [LOGO DEL NEGOCIO]

    Victoria Productos Artesanales
```

---

# 37. Seguridad

Requisitos mínimos:

* HTTPS en producción.
* PIN almacenado mediante hash.
* No devolver PIN mediante API.
* Middleware de autenticación.
* Middleware de autorización por rol.
* Validación de entradas.
* Protección contra acceso no autorizado.
* No exponer credenciales de base de datos al frontend.
* Variables sensibles mediante variables de entorno.
* CORS correctamente configurado.
* Sesiones/token con expiración.
* Logout.

Las credenciales de MySQL nunca deben estar presentes en el frontend.

---

# 38. Arquitectura del backend

Se recomienda separar responsabilidades:

```text
backend/
└── src/
    ├── controllers/
    │   ├── authController
    │   ├── productoController
    │   ├── stockController
    │   ├── categoriaController
    │   ├── usuarioController
    │   └── actividadController
    │
    ├── routes/
    │   ├── authRoutes
    │   ├── productoRoutes
    │   ├── stockRoutes
    │   ├── categoriaRoutes
    │   ├── usuarioRoutes
    │   └── actividadRoutes
    │
    ├── middleware/
    │   ├── authMiddleware
    │   └── roleMiddleware
    │
    ├── services/
    │   ├── precioService
    │   ├── stockService
    │   └── actividadService
    │
    ├── db/
    │   └── connection
    │
    └── app
```

La estructura exacta puede variar si existe una mejor alternativa, pero debe mantenerse una separación clara entre:

* rutas
* controladores
* servicios
* middleware
* acceso a datos

---

# 39. Frontend

El frontend debe utilizar componentes reutilizables.

Ejemplos:

```text
components/
├── ProductCard
├── StockBadge
├── SearchBar
├── BottomNavigation
├── Header
├── Button
├── Input
├── Modal
└── Loading
```

Pantallas:

```text
pages/
├── Login
├── Inicio
├── Productos
├── AgregarProducto
├── DetalleProducto
├── Reponer
├── MiCuenta
├── AcercaDe
└── Admin
```

La arquitectura debe evitar duplicar lógica.

---

# 40. Estados de carga y errores

La aplicación debe manejar correctamente:

* Cargando.
* Sin datos.
* Error de conexión.
* Error del servidor.
* Sesión expirada.
* Producto inexistente.
* Usuario sin permisos.

No mostrar errores técnicos incomprensibles a la usuaria.

En lugar de:

```text
500 Internal Server Error
```

mostrar algo como:

> No pudimos completar la operación. Intentá nuevamente.

Los errores técnicos deben registrarse en el backend cuando corresponda.

---

# 41. Validaciones

### Producto

* Nombre obligatorio.
* Precio de compra no negativo.
* Costo real no negativo.
* Margen válido.
* Stock no negativo.
* Stock mínimo no negativo.
* Unidad de venta obligatoria.

### Margen

Debe impedirse:

```text
margen < 0%
margen >= 100%
```

La fórmula no es válida para un margen de 100% o superior porque provocaría división por cero o resultados inválidos.

### Stock

No permitir:

```text
stock < 0
```

salvo futura modificación explícita de la regla.

---

# 42. Redondeo de precios

El sistema debe calcular internamente con suficiente precisión.

El precio mostrado al usuario debe utilizar formato monetario adecuado.

La estrategia exacta de redondeo debe ser consistente en todo el sistema.

Para Argentina, mostrar valores de forma legible:

```text
$20.000
$7.500
$1.250
```

La lógica interna no debe depender del formato visual.

---

# 43. Funcionalidades fuera del MVP

No implementar inicialmente:

* Sistema completo de ventas.
* Facturación.
* AFIP.
* Integración con Mercado Pago.
* Proveedores.
* Compras avanzadas.
* Órdenes de compra.
* Distribución automática de fletes.
* Contabilidad.
* Reportes financieros avanzados.
* Clientes.
* Cuentas corrientes.
* Multi-sucursal.
* Integración con lectores de código de barras.
* Integración con impresoras.
* Notificaciones externas.
* Aplicación Android/iOS nativa.
* Sistema de suscripciones.
* Sistema de pagos.

Estas funcionalidades pueden considerarse para versiones futuras si el negocio realmente las necesita.

---

# 44. Escalabilidad futura

Aunque el MVP debe ser sencillo, la arquitectura debe permitir posteriormente agregar:

* Ventas.
* Compras.
* Proveedores.
* Clientes.
* Reportes.
* Estadísticas.
* Código de barras.
* Exportación de datos.
* Backups.
* Multi-negocio.
* Multiusuario avanzado.
* Configuración global.
* Diferentes listas de precios.

No implementar estas funciones ahora.

---

# 45. Modelo conceptual del negocio

El flujo principal de ControlAR será:

```text
                    PRODUCTO
                       │
              ┌────────┴────────┐
              │                 │
           CATEGORÍA        UNIDAD DE VENTA
              │                 │
              │                 │
              └────────┬────────┘
                       │
                  COSTO REAL
                       │
                       ▼
                 MARGEN PROPIO
                       │
                       ▼
              PRECIO DE GÓNDOLA
                       │
                       ▼
                    STOCK
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          ENTRADA    SALIDA    AJUSTE
             │         │         │
             └─────────┼─────────┘
                       ▼
               HISTORIAL STOCK
```

---

# 46. Flujo principal de uso

## Primera configuración

1. SUPER_ADMIN crea usuario.
2. Usuario inicia sesión.
3. Se configuran categorías.
4. Se cargan productos.

## Carga de producto

1. Nombre.
2. Categoría opcional.
3. Unidad de venta.
4. Precio de compra.
5. Costo real.
6. Margen.
7. Stock inicial.
8. Stock mínimo.
9. ControlAR calcula precio de góndola.
10. Producto queda disponible.

## Uso cotidiano

La usuaria entra a ControlAR:

```text
Inicio
   ↓
Consulta stock
   ↓
Ve productos para reponer
   ↓
Realiza entrada/salida
   ↓
ControlAR registra movimiento
   ↓
Stock actualizado
```

---

# 47. Regla fundamental del proyecto

ControlAR debe diseñarse para **el negocio real**, no para un negocio genérico.

Las decisiones funcionales deben priorizar la forma en que trabaja Victoria Productos Artesanales.

No agregar funcionalidades solamente porque sean comunes en otros sistemas de gestión.

La simplicidad es un requisito del producto.

---

# 48. Identidad visual

El nombre oficial del sistema será:

# ControlAR

Subtítulo:

**Sistema de gestión para Victoria Productos Artesanales**

Los siguientes elementos quedan pendientes:

* Logo de ControlAR.
* Logo de Victoria Productos Artesanales.
* Paleta de colores definitiva.
* Tipografías definitivas.
* Identidad visual completa.

No inventar estos elementos durante la implementación.

Se utilizarán placeholders hasta que sean definidos.

---

# 49. Versión inicial

Nombre:

**ControlAR v1.0.0**

Año:

**2026**

Desarrollador:

**Lucas**

Negocio de referencia:

**Victoria Productos Artesanales**

---

# 50. Criterio de finalización del MVP

El MVP será considerado funcional cuando:

* La PWA pueda instalarse en un teléfono.
* El usuario pueda iniciar sesión.
* El usuario pueda crear productos.
* Los productos puedan tener diferentes márgenes.
* El sistema calcule correctamente el precio de góndola.
* Se pueda utilizar costo real.
* Se puedan utilizar diferentes unidades de venta.
* Se puedan manejar productos por unidad.
* Se puedan manejar productos por gramos.
* Se puedan manejar productos por kilogramos.
* Se pueda consultar el stock.
* Se pueda realizar entrada de stock.
* Se pueda realizar salida de stock.
* Se pueda realizar ajuste de stock.
* Se pueda consultar el historial de movimientos.
* Se puedan identificar productos para reponer.
* Se puedan identificar productos agotados.
* Exista autenticación.
* Existan roles USER y SUPER_ADMIN.
* El SUPER_ADMIN pueda administrar usuarios.
* Exista auditoría básica.
* Exista la sección Acerca de.
* La interfaz sea usable desde teléfono.
* Los datos persistan correctamente en MySQL.
* Frontend, backend y base de datos estén correctamente conectados.

---

# 51. Instrucción para la implementación

Este documento debe considerarse la **fuente principal de requisitos para ControlAR v1.0**.

Antes de implementar:

1. Analizar completamente este documento.
2. No asumir funcionalidades que no estén especificadas.
3. No eliminar requisitos existentes sin justificación.
4. No agregar funcionalidades complejas fuera del MVP.
5. Mantener separación entre frontend, backend y base de datos.
6. Priorizar seguridad en backend.
7. Mantener el diseño mobile-first.
8. Mantener la aplicación sencilla para usuarios no técnicos.
9. Utilizar datos de prueba durante el desarrollo.
10. Preparar la aplicación para despliegue en Vercel + Railway.
11. Documentar variables de entorno necesarias.
12. Proporcionar instrucciones claras para ejecutar el proyecto localmente.
13. Crear una estructura de proyecto mantenible y escalable.
14. No inventar logos ni identidad visual.
15. No implementar funcionalidades fuera del alcance sin autorización.

---

# 52. Resumen final

**ControlAR** será una PWA de gestión para **Victoria Productos Artesanales**, enfocada inicialmente en:

> **Productos + Stock + Costos + Márgenes + Precios + Reposición**

El sistema debe ser sencillo para el uso cotidiano, pero tener una arquitectura suficientemente sólida para convertirse posteriormente en un sistema de gestión comercial más completo.

La regla de precios será:

$$
\boxed{Precio\ de\ góndola =
\frac{Costo\ real}{1-Margen}}
$$

Cada producto puede tener un margen diferente.

Cada producto puede tener una unidad de venta diferente.

El stock se modifica únicamente mediante movimientos.

Los productos son compartidos por el negocio y no pertenecen individualmente a los usuarios.

El sistema tendrá dos roles:

**USUARIO** y **SUPER_ADMIN**.

La primera versión debe enfocarse en resolver correctamente las necesidades reales de Victoria Productos Artesanales antes de intentar convertirse en un sistema comercial completo.
