# ControlAR v1.0.5b

**Sistema de gestión para Victoria Productos Artesanales**

---

## 📌 Descripción general

ControlAR es una Progressive Web App (PWA) Mobile-First diseñada para el control diario de stock, costos, márgenes de ganancia y precios de góndola de **Victoria Productos Artesanales**.

El sistema cumple rigurosamente con la especificación técnica y funcional definida en [controlar.md](file:///c:/Users/SP/Desktop/ControlAR/docs/controlar.md).

---

## 📐 Regla oficial de cálculo de precios (Precio de Mostrador)

$$\text{Precio de mostrador} = \text{Precio de compra (con IVA)} \times \left(1 + \frac{\text{Porcentaje de ganancia o recargo}}{100}\right)$$

* El porcentaje representa un recargo directo sobre el costo con IVA incluido, adaptado a la modalidad operativa de Victoria Productos Artesanales.
* Valor predeterminado comercial inicial del 50% para productos nuevos (configurable por la usuaria).
* Cada producto conserva de forma persistente su propio porcentaje de recargo y precio una vez guardado.
* El backend es la única fuente de verdad; valida que el precio de compra y el porcentaje no sean negativos.
* El frontend provee cálculo proyectado en tiempo real y asistente de costo unitario para fraccionados.

---

## 🏗️ Arquitectura del Proyecto

```text
ControlAR/
├── backend/                      # Node.js + Express + MySQL API
│   ├── src/
│   │   ├── config/               # Conexión DB MySQL (con auto-init y fallback SQLite para dev)
│   │   ├── controllers/          # auth, producto, stock, categoria, usuario, actividad, sistema
│   │   ├── routes/               # Rutas REST
│   │   ├── middleware/           # authMiddleware (JWT), roleMiddleware (SUPER_ADMIN), errorMiddleware
│   │   ├── services/             # precioService, stockService (atómico), actividadService
│   │   └── server.js             # Bootstrap del servidor
│   ├── schema.sql                # DDL oficial de base de datos MySQL y seeds
│   └── package.json
│
├── frontend/                     # React + Vite + PWA Mobile-First
│   ├── src/
│   │   ├── components/           # ProductCard, StockBadge, StockModal, Header, BottomNavigation
│   │   ├── pages/                # Login, Inicio, Productos, Agregar, Detalle, Reponer, MiCuenta, AcercaDe, Admin
│   │   ├── context/              # AuthContext (JWT, estado global de sesión)
│   │   └── utils/                # formatters (pesos argentinos $ 20.000, unidades de venta)
│   ├── public/                   # Manifest PWA y recursos gráficos
│   └── package.json
│
└── docs/
    └── controlar.md              # Especificación técnica oficial
```

---

## 🚀 Puesta en marcha local

### Prerrequisitos
* Node.js v18+ y npm.
* MySQL (opcional en desarrollo; el backend cuenta con auto-detección y base local de desarrollo si el servicio MySQL no está iniciado).

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm start
```
El servidor quedará disponible en `http://localhost:3001/api`.

### 2. Iniciar el Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:5173/`.

---

## 🔑 Credencial oficial de Administrador

| Rol | DNI | PIN inicial |
| :--- | :--- | :--- |
| **SUPER_ADMIN** (Administrador) | `47115449` | `1234` |

> *Nota: Los usuarios operativos del negocio (rol `USUARIO`) se crean y administran directamente desde el **Panel de Administración** > pestaña **Usuarios**.*

---

## 🌐 Despliegue en Producción

### Frontend (Vercel)
1. Conectar el repositorio en [Vercel](https://vercel.com).
2. Configurar el directorio raíz en `frontend`.
3. Definir la variable de entorno:
   - `VITE_API_URL`: URL del backend en Railway (ej: `https://controlar-api.up.railway.app/api`).
4. Comando de build: `npm run build` (directorio de salida: `dist`).

### Backend (Railway)
1. Crear un proyecto en [Railway](https://railway.app).
2. Agregar un servicio MySQL administrado.
3. Importar el servicio Node.js desde la carpeta `backend`.
4. Configurar las variables de entorno de producción:
   - `PORT`: Provisto automáticamente por Railway.
   - `DB_HOST`: Host de MySQL Railway (`MYSQLHOST`).
   - `DB_PORT`: Puerto de MySQL Railway (`MYSQLPORT`).
   - `DB_USER`: Usuario MySQL (`MYSQLUSER`).
   - `DB_PASSWORD`: Contraseña MySQL (`MYSQLPASSWORD`).
   - `DB_NAME`: Nombre de la BD (`MYSQLDATABASE`).
   - `JWT_SECRET`: Clave aleatoria segura para firma de tokens.
   - `CORS_ORIGIN`: URL de la aplicación en Vercel (ej: `https://controlar.vercel.app`).
5. Ejecutar la inicialización del esquema importando `schema.sql`.
