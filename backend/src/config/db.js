import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mode = 'mysql'; // 'mysql' | 'sqlite'
let pool = null;
let sqliteDb = null;

// Convert MySQL SQL dialect to SQLite if using sqlite fallback
function adaptSqlForSqlite(sql) {
  let s = sql;
  s = s.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
  s = s.replace(/INSERT IGNORE INTO/gi, 'INSERT OR IGNORE INTO');
  s = s.replace(/DECIMAL\([^)]+\)/gi, 'REAL');
  s = s.replace(/BOOLEAN/gi, 'INTEGER');
  s = s.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  s = s.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  s = s.replace(/DATETIME/gi, 'TEXT');
  s = s.replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;/gi, ';');
  s = s.replace(/ENGINE=InnoDB/gi, '');
  s = s.replace(/ON DELETE RESTRICT/gi, '');
  return s;
}

// Initialize SQLite fallback database
async function initSqlite() {
  mode = 'sqlite';
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'controlar.sqlite');
  
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      console.log(`[DB] Usando base de datos SQLite de desarrollo local: ${dbPath}`);
      setupSqliteTables().then(resolve).catch(reject);
    });
  });
}

function runSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ insertId: this.lastID, affectedRows: this.changes });
    });
  });
}

function allSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function setupSqliteTables() {
  await runSqlite(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dni TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'USUARIO',
      puede_gestionar_categorias INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1,
      ultimo_acceso TEXT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migración segura para SQLite existente
  try {
    await runSqlite('ALTER TABLE usuarios ADD COLUMN puede_gestionar_categorias INTEGER DEFAULT 0');
  } catch (e) {
    // Columna ya existe o tabla recién creada
  }

  await runSqlite(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      margen_predeterminado REAL NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSqlite(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria_id INTEGER NULL,
      unidad_venta TEXT NOT NULL DEFAULT 'Unidad',
      precio_compra REAL NOT NULL DEFAULT 0,
      costo_real REAL NOT NULL DEFAULT 0,
      margen_ganancia REAL NOT NULL DEFAULT 0,
      precio_gondola REAL NOT NULL DEFAULT 0,
      stock_actual REAL NOT NULL DEFAULT 0,
      stock_minimo REAL NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSqlite(`
    CREATE TABLE IF NOT EXISTS movimientos_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      cantidad REAL NOT NULL,
      stock_anterior REAL NOT NULL,
      stock_nuevo REAL NOT NULL,
      motivo TEXT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSqlite(`
    CREATE TABLE IF NOT EXISTS actividad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NULL,
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id INTEGER NULL,
      descripcion TEXT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSqlite(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      descripcion TEXT NULL,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSqlite(`
    INSERT OR IGNORE INTO configuracion (clave, valor, descripcion)
    VALUES ('margen_predeterminado', '50.00', 'Porcentaje predeterminado inicial para productos nuevos')
  `);

  // Seeds
  const defaultPinHash = bcrypt.hashSync('1234', 10);

  // Super Admin: DNI 99999999, PIN 1234
  await runSqlite(
    `INSERT OR IGNORE INTO usuarios (id, dni, nombre, apellido, pin_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, '99999999', 'Administrador', 'ControlAR', defaultPinHash, 'SUPER_ADMIN', 1]
  );

  // Usuario: DNI 12345678, PIN 1234
  await runSqlite(
    `INSERT OR IGNORE INTO usuarios (id, dni, nombre, apellido, pin_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [2, '12345678', 'María', 'Victoria', defaultPinHash, 'USUARIO', 1]
  );

  // Categorías iniciales
  const categorias = [
    [1, 'Snacks', 60.0, 1],
    [2, 'Jugos', 40.0, 1],
    [3, 'Limpieza', 35.0, 1],
    [4, 'Bebidas', 40.0, 1],
    [5, 'Golosinas', 50.0, 1],
    [6, 'Congelados', 45.0, 1],
    [7, 'Yogures', 40.0, 1],
    [8, 'Otros', 50.0, 1]
  ];

  for (const c of categorias) {
    await runSqlite(`INSERT OR IGNORE INTO categorias (id, nombre, margen_predeterminado, activo) VALUES (?, ?, ?, ?)`, c);
  }

  // Productos iniciales de demostración según controlar.md
  // 1. Snack X (400g bolsa, se vende por gramo a $25/g, stock actual 120g, stock min 200g -> REPONER)
  // 2. Jugo X (unidades, precio compra $600, costo $600, margen 40% -> $1000, stock 2, min 5 -> REPONER)
  // 3. Yogur X (unidades, stock 1, min 4 -> REPONER)
  // 4. Congelado X (kg, stock 0, min 2 -> AGOTADO)
  // 5. Bebida Cola 1.5L (unidades, stock 12, min 6 -> DISPONIBLE)
  const productosDemo = [
    [1, 'Snack Frutos Secos', 1, 'Gramo', 10.0, 10.0, 60.0, 25.0, 120.0, 200.0, 1],
    [2, 'Jugo de Naranja 1L', 2, 'Unidad', 600.0, 600.0, 40.0, 1000.0, 2.0, 5.0, 1],
    [3, 'Yogur Natural Artesanal', 7, 'Unidad', 900.0, 900.0, 40.0, 1500.0, 1.0, 4.0, 1],
    [4, 'Hamburguesas Caseras Congeladas', 6, 'Kilogramo', 4400.0, 4400.0, 45.0, 8000.0, 0.0, 2.5, 1],
    [5, 'Detergente Artesanal 500ml', 3, 'Unidad', 1300.0, 1300.0, 35.0, 2000.0, 15.0, 5.0, 1]
  ];

  for (const p of productosDemo) {
    await runSqlite(
      `INSERT OR IGNORE INTO productos (id, nombre, categoria_id, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p
    );
  }
}

async function initializeMySqlSchema(conn) {
  try {
    const [tables] = await conn.query("SHOW TABLES LIKE 'usuarios'");
    if (!tables || tables.length === 0) {
      console.log(`[DB] Tablas no detectadas en MySQL. Inicializando esquema oficial desde schema.sql...`);
      const schemaPath = path.join(__dirname, '../../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE '));

        for (const stmt of statements) {
          try {
            await conn.query(stmt);
          } catch (e) {
            // Ignorar errores de tablas ya creadas
          }
        }
        console.log(`[DB] Esquema oficial y datos semilla inicializados con éxito en MySQL.`);
      }
    }
  } catch (err) {
    console.warn(`[DB] Advertencia al verificar/inicializar esquema MySQL: ${err.message}`);
  }
}

// Connect to MySQL or fall back to SQLite
export async function connectDB() {
  if (process.env.DB_DRIVER === 'sqlite') {
    await initSqlite();
    return;
  }

  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : (process.env.DB_PASSWORD || '');
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'controlar_db';

  try {
    // Intentar conexión directa (soporta Railway MYSQL_URL o variables individuales)
    if (connectionUrl) {
      pool = mysql.createPool(connectionUrl);
    } else {
      pool = mysql.createPool({
        host, port, user, password, database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }

    const conn = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a MySQL (${connectionUrl ? 'URL' : `${host}:${port}/${database}`})`);
    
    // Auto-inicializar tablas si la base de datos está vacía (ej: nuevo servicio en Railway)
    await initializeMySqlSchema(conn);

    try {
      await conn.query('ALTER TABLE usuarios ADD COLUMN puede_gestionar_categorias BOOLEAN NOT NULL DEFAULT FALSE');
    } catch (migErr) {
      // Ignorar si la columna ya existe
    }

    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS configuracion (
          clave VARCHAR(50) PRIMARY KEY,
          valor TEXT NOT NULL,
          descripcion VARCHAR(255) NULL,
          actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await conn.query(`
        INSERT IGNORE INTO configuracion (clave, valor, descripcion)
        VALUES ('margen_predeterminado', '50.00', 'Porcentaje predeterminado inicial para productos nuevos')
      `);
    } catch (confErr) {
      // Ignorar si ya existe
    }
    conn.release();
    mode = 'mysql';
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      try {
        console.log(`[DB] Base de datos '${database}' no encontrada en MySQL. Intentando crearla automáticamente...`);
        const rootConn = await mysql.createConnection({ host, port, user, password });
        await rootConn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.end();

        // Conectar nuevamente
        pool = mysql.createPool({
          host, port, user, password, database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        const c = await pool.getConnection();
        await initializeMySqlSchema(c);
        c.release();

        console.log(`[DB] Base de datos MySQL '${database}' creada e inicializada correctamente.`);
        mode = 'mysql';
        return;
      } catch (createErr) {
        console.warn(`[DB] No se pudo auto-crear base MySQL: ${createErr.message}`);
      }
    }

    console.warn(`[DB] MySQL no disponible (${err.message}). Activando modo fallback SQLite para desarrollo local.`);
    await initSqlite();
  }
}

// Unified Query Function
export async function query(sql, params = []) {
  if (mode === 'mysql') {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } else {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('SHOW') || trimmed.startsWith('DESCRIBE')) {
      return await allSqlite(sql, params);
    } else {
      const res = await runSqlite(sql, params);
      return {
        insertId: res.insertId,
        affectedRows: res.affectedRows
      };
    }
  }
}

export function getDbMode() {
  return mode;
}

export default {
  connectDB,
  query,
  getDbMode
};
