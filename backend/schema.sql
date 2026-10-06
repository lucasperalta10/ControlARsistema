-- ========================================================
-- ControlAR v1.0 - Esquema Oficial de Base de Datos (MySQL)
-- Victoria Productos Artesanales
-- ========================================================

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  rol ENUM('USUARIO', 'SUPER_ADMIN') NOT NULL DEFAULT 'USUARIO',
  puede_gestionar_categorias BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso DATETIME NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_dni (dni),
  INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  margen_predeterminado DECIMAL(5,2) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categorias_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria_id INT NULL,
  unidad_venta ENUM('Unidad', 'Gramo', 'Kilogramo', 'Mililitro', 'Litro') NOT NULL DEFAULT 'Unidad',
  precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  costo_real DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  margen_ganancia DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  precio_gondola DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_actual DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  stock_minimo DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  INDEX idx_productos_activo (activo),
  INDEX idx_productos_nombre (nombre),
  INDEX idx_productos_categoria (categoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla: movimientos_stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
  cantidad DECIMAL(10,3) NOT NULL,
  stock_anterior DECIMAL(10,3) NOT NULL,
  stock_nuevo DECIMAL(10,3) NOT NULL,
  motivo VARCHAR(255) NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_movimientos_producto (producto_id),
  INDEX idx_movimientos_usuario (usuario_id),
  INDEX idx_movimientos_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabla: actividad
CREATE TABLE IF NOT EXISTS actividad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT NULL,
  descripcion TEXT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_actividad_usuario (usuario_id),
  INDEX idx_actividad_accion (accion),
  INDEX idx_actividad_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- Datos semilla iniciales (Seeds)
-- PIN por defecto: "1234" (hash bcrypt: $2a$10$w09Zk.xYqfFv7Z8j7r6mI.oPZqF2fB9v7qfG1eE8oO4d6vH5jK7y6)
-- Generado con bcrypt salt rounds 10
-- ========================================================

-- Categorías por defecto
INSERT IGNORE INTO categorias (id, nombre, margen_predeterminado, activo) VALUES
(1, 'Snacks', 60.00, 1),
(2, 'Jugos', 40.00, 1),
(3, 'Limpieza', 35.00, 1),
(4, 'Bebidas', 40.00, 1),
(5, 'Golosinas', 50.00, 1),
(6, 'Congelados', 45.00, 1),
(7, 'Yogures', 40.00, 1),
(8, 'Otros', 50.00, 1);

-- Usuario SUPER_ADMIN inicial (DNI: 99999999, PIN: 1234)
INSERT IGNORE INTO usuarios (id, dni, nombre, apellido, pin_hash, rol, activo) VALUES
(1, '47115449', 'Administrador', 'ControlAR', '$2a$10$3YcAf6yyjHtxVCpXVUIrfuBjio.9G7ulT60hVPcesVS1EJtoywGBu', 'SUPER_ADMIN', 1);

-- Usuario estándar inicial (DNI: 12345678, PIN: 1234)
INSERT IGNORE INTO usuarios (id, dni, nombre, apellido, pin_hash, rol, activo) VALUES
(2, '12345678', 'María', 'Victoria', '$2a$10$3YcAf6yyjHtxVCpXVUIrfuBjio.9G7ulT60hVPcesVS1EJtoywGBu', 'USUARIO', 1);
