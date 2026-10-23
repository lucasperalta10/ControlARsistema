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
    [1, 'Snack Frutos Secos', 1, 'Gramo', 10.0, 10.0, 60.0, 16.0, 120.0, 200.0, 1],
    [2, 'Jugo de Naranja 1L', 2, 'Unidad', 600.0, 600.0, 40.0, 840.0, 2.0, 5.0, 1],
    [3, 'Yogur Natural Artesanal', 7, 'Unidad', 900.0, 900.0, 40.0, 1260.0, 1.0, 4.0, 1],
    [4, 'Hamburguesas Caseras Congeladas', 6, 'Kilogramo', 4400.0, 4400.0, 45.0, 6380.0, 0.0, 2.5, 1],
    [5, 'Detergente Artesanal 500ml', 3, 'Unidad', 1300.0, 1300.0, 35.0, 1755.0, 15.0, 5.0, 1]
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

// Asegura que los precios de mostrador existentes coincidan con la fórmula oficial
async function sincronizarPreciosMostrador() {
  try {
    const updateSql = `
      UPDATE productos 
      SET precio_gondola = ROUND(costo_real * (1 + (margen_ganancia / 100)), 2)
      WHERE activo = 1 AND costo_real > 0 AND margen_ganancia >= 0
    `;
    if (mode === 'mysql' && pool) {
      await pool.execute(updateSql);
    } else if (sqliteDb) {
      await runSqlite(updateSql);
    }
  } catch (syncErr) {
    console.warn(`[DB] Advertencia al sincronizar precios de mostrador: ${syncErr.message}`);
  }
}

// Variable / testing hook
let connectionFactory = null;

export function _setConnectionFactoryForTesting(factory) {
  connectionFactory = factory;
}

export function isProduction() {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase().trim();
  const isProdEnv = nodeEnv === 'production';
  const isRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.RAILWAY_STATIC_URL
  );
  return isProdEnv || isRailway;
}

export function isSqliteAllowed() {
  if (isProduction()) {
    return false;
  }
  const driver = (process.env.DB_DRIVER || '').toLowerCase().trim();
  return driver === 'sqlite';
}

export function maskUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return String(rawUrl).replace(/:([^:@/]+)@/, ':***@');
  }
}

export function sanitizeErrorMessage(message) {
  if (!message) return '';
  return String(message)
    .replace(/:([^:@/\s]+)@/g, ':***@')
    .replace(/password\s*=\s*['"]?[^'",\s]+['"]?/gi, 'password=***');
}

export function getSafeConnectionDetails() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connectionUrl) {
    return `URL (${maskUrl(connectionUrl)})`;
  }
  const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'controlar_db';
  return `${user}@${host}:${port}/${database}`;
}

export function isTransientError(err) {
  if (!err) return false;
  const transientCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ECONNRESET',
    'PROTOCOL_CONNECTION_LOST',
    'ER_CON_COUNT_ERROR',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
  ];
  return (
    transientCodes.includes(err.code) ||
    /connection refused|timeout|network|econnrefused|econnreset/i.test(err.message || '')
  );
}

async function attemptMySqlConnection() {
  if (connectionFactory) {
    return await connectionFactory();
  }

  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : (process.env.DB_PASSWORD || '');
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'controlar_db';

  let currentPool = null;
  if (connectionUrl) {
    currentPool = mysql.createPool(connectionUrl);
  } else {
    currentPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  try {
    const conn = await currentPool.getConnection();
    return { pool: currentPool, conn };
  } catch (err) {
    if (currentPool) {
      await currentPool.end().catch(() => {});
    }
    throw err;
  }
}

const MAX_CONNECT_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Connect to MySQL or safely handle fallback/exit
export async function connectDB() {
  // 1. Verificación de SQLite explícito
  if (process.env.DB_DRIVER === 'sqlite') {
    if (isProduction()) {
      const errMsg = '[DB] BLOQUEO DE SEGURIDAD: SQLite está estrictamente prohibido en entornos de producción o Railway. Configura MySQL para continuar.';
      console.error(errMsg);
      throw new Error(errMsg);
    }
    await initSqlite();
    await sincronizarPreciosMostrador();
    return;
  }

  // 2. Conexión a MySQL con reintentos para fallos transitorios
  let lastError = null;
  const maxRetries = Number(process.env.DB_CONNECT_RETRIES) || MAX_CONNECT_RETRIES;
  const initialDelay = Number(process.env.DB_RETRY_DELAY_MS) || INITIAL_RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { pool: activePool, conn } = await attemptMySqlConnection();
      pool = activePool;
      mode = 'mysql';

      const safeTarget = getSafeConnectionDetails();
      if (attempt > 1) {
        console.log(`[DB] Conectado exitosamente a MySQL tras ${attempt} intentos (${safeTarget})`);
      } else {
        console.log(`[DB] Conectado exitosamente a MySQL (${safeTarget})`);
      }

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
      await sincronizarPreciosMostrador();
      return;
    } catch (err) {
      lastError = err;
      const safeTarget = getSafeConnectionDetails();
      const safeErrMsg = sanitizeErrorMessage(err.message);
      const isTransient = isTransientError(err);

      // Si es fallo no transitorio (ej: credenciales inválidas ER_ACCESS_DENIED_ERROR), no reintentar
      if (!isTransient) {
        console.error(`[DB] Error no recuperable al conectar a MySQL [${safeTarget}]: ${safeErrMsg} (Código: ${err.code || 'N/A'})`);
        break;
      }

      if (attempt < maxRetries) {
        const delayMs = initialDelay * attempt;
        console.warn(`[DB] Fallo transitorio de conexión a MySQL [${safeTarget}] (${err.code || safeErrMsg}). Reintento ${attempt}/${maxRetries} en ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  // 3. Si se agotaron los reintentos o hubo error no transitorio
  const safeTarget = getSafeConnectionDetails();
  const safeErrMsg = sanitizeErrorMessage(lastError?.message || 'Error de conexión desconocido');
  const errCode = lastError?.code ? ` (Código: ${lastError.code})` : '';

  if (isProduction()) {
    console.error(`[DB] ERROR CRÍTICO: No se pudo conectar a MySQL en producción/Railway [${safeTarget}]: ${safeErrMsg}${errCode}.`);
    console.error(`[DB] POLÍTICA DE SEGURIDAD: El servidor se rehusará a arrancar para proteger la integridad de los datos. SQLite no está permitido.`);
    throw new Error(`[DB] Falla de conexión a MySQL en producción: ${safeErrMsg}${errCode}`);
  }

  // En desarrollo local: sólo usar SQLite si está expresamente permitido por configuración
  if (isSqliteAllowed()) {
    console.warn(`[DB] MySQL no disponible [${safeTarget}] (${safeErrMsg}${errCode}). Activando SQLite expresamente permitido en desarrollo.`);
    await initSqlite();
    await sincronizarPreciosMostrador();
    return;
  }

  console.error(`[DB] ERROR: MySQL no disponible [${safeTarget}] (${safeErrMsg}${errCode}).`);
  console.error(`[DB] El fallback silencioso a SQLite está deshabilitado. Para usar SQLite en desarrollo local, debes configurar explícitamente DB_DRIVER=sqlite.`);
  throw new Error(`[DB] Fallo de conexión a MySQL y SQLite no está expresamente permitido: ${safeErrMsg}${errCode}`);
}

// Unified Query Function
export async function query(sql, params = []) {
  if (mode === 'mysql') {
    if (!pool) {
      throw new Error('[DB] Error de consulta: El pool de conexiones MySQL no está inicializado.');
    }
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } else {
    if (!sqliteDb) {
      throw new Error('[DB] Error de consulta: La base de datos SQLite no está inicializada.');
    }
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

export async function closeDB() {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
  }
  if (sqliteDb) {
    await new Promise(resolve => sqliteDb.close(() => resolve()));
    sqliteDb = null;
  }
  mode = 'mysql';
}

export default {
  connectDB,
  query,
  getDbMode,
  closeDB,
  isProduction,
  isSqliteAllowed,
  maskUrl,
  sanitizeErrorMessage,
  getSafeConnectionDetails,
  isTransientError,
  _setConnectionFactoryForTesting
};

