import {
  connectDB,
  closeDB,
  query,
  getDbMode,
  isProduction,
  isSqliteAllowed,
  maskUrl,
  sanitizeErrorMessage,
  getSafeConnectionDetails,
  isTransientError,
  _setConnectionFactoryForTesting
} from '../src/config/db.js';

async function runAuditTests() {
  console.log('================================================================');
  console.log('🧪 PRUEBAS DE AUDITORÍA Y SEGURIDAD: CONEXIÓN A BD (ControlAR)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // Guardar variables de entorno originales para restaurarlas
  const originalEnv = { ...process.env };

  function restoreEnv() {
    process.env = { ...originalEnv };
    _setConnectionFactoryForTesting(null);
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: Ausencia de credenciales sensibles en logs y saneamiento
    // -----------------------------------------------------------------
    console.log('--- 1. Protección de credenciales sensibles en logs ---');
    
    const sampleRailwayUrl = 'mysql://root:MiPasswordSecreto123@containers-us-west-42.railway.app:3306/railway';
    const masked = maskUrl(sampleRailwayUrl);
    assert(
      !masked.includes('MiPasswordSecreto123') && masked.includes('***') && masked.includes('containers-us-west-42.railway.app'),
      `maskUrl oculta la contraseña correctamente: ${masked}`
    );

    const sensitiveError = 'Error connecting to mysql://root:SuperTokenXYZ@db:3306/prod: password=SuperTokenXYZ';
    const sanitizedMsg = sanitizeErrorMessage(sensitiveError);
    assert(
      !sanitizedMsg.includes('SuperTokenXYZ') && sanitizedMsg.includes('***'),
      `sanitizeErrorMessage oculta tokens y contraseñas en mensajes de error: ${sanitizedMsg}`
    );

    process.env.MYSQL_URL = sampleRailwayUrl;
    const safeDetails = getSafeConnectionDetails();
    assert(
      !safeDetails.includes('MiPasswordSecreto123') && safeDetails.includes('***'),
      `getSafeConnectionDetails() nunca expone contraseña al formatear Railway MYSQL_URL: ${safeDetails}`
    );
    delete process.env.MYSQL_URL;

    // -----------------------------------------------------------------
    // TEST 2: Determinación segura de entorno (Producción / Railway vs Dev)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Determinación de entorno y permisos de SQLite ---');

    process.env.NODE_ENV = 'production';
    delete process.env.RAILWAY_ENVIRONMENT;
    assert(isProduction() === true, 'isProduction detecta NODE_ENV=production');

    process.env.NODE_ENV = 'development';
    process.env.RAILWAY_ENVIRONMENT = 'production';
    assert(isProduction() === true, 'isProduction detecta entorno Railway (RAILWAY_ENVIRONMENT)');

    delete process.env.RAILWAY_ENVIRONMENT;
    process.env.RAILWAY_PROJECT_ID = 'railway-prj-xyz';
    assert(isProduction() === true, 'isProduction detecta variable Railway RAILWAY_PROJECT_ID');

    delete process.env.RAILWAY_PROJECT_ID;
    process.env.NODE_ENV = 'development';
    assert(isProduction() === false, 'isProduction retorna false en desarrollo local sin variables Railway');

    // Permisos SQLite
    process.env.NODE_ENV = 'development';
    process.env.DB_DRIVER = 'sqlite';
    assert(isSqliteAllowed() === true, 'isSqliteAllowed es true en dev cuando DB_DRIVER=sqlite');

    process.env.DB_DRIVER = '';
    assert(isSqliteAllowed() === false, 'isSqliteAllowed es false en dev si DB_DRIVER no es sqlite');

    process.env.NODE_ENV = 'production';
    process.env.DB_DRIVER = 'sqlite';
    assert(isSqliteAllowed() === false, 'isSqliteAllowed es FALSE SIEMPRE en producción, incluso con DB_DRIVER=sqlite');

    // -----------------------------------------------------------------
    // TEST 3: Detección precisa de errores transitorios
    // -----------------------------------------------------------------
    console.log('\n--- 3. Clasificación de errores transitorios vs no recuperables ---');

    const errConnRefused = new Error('connect ECONNREFUSED 127.0.0.1:3306');
    errConnRefused.code = 'ECONNREFUSED';
    assert(isTransientError(errConnRefused) === true, 'ECONNREFUSED se clasifica como transitorio (reintentable)');

    const errTimeout = new Error('connection timed out');
    errTimeout.code = 'ETIMEDOUT';
    assert(isTransientError(errTimeout) === true, 'ETIMEDOUT se clasifica como transitorio');

    const errAuth = new Error("Access denied for user 'root'@'localhost'");
    errAuth.code = 'ER_ACCESS_DENIED_ERROR';
    assert(isTransientError(errAuth) === false, 'ER_ACCESS_DENIED_ERROR NO es transitorio (no reintentar credenciales incorrectas)');

    // -----------------------------------------------------------------
    // TEST 4: Conexión exitosa a MySQL
    // -----------------------------------------------------------------
    console.log('\n--- 4. Conexión exitosa a MySQL ---');
    await closeDB();
    process.env.NODE_ENV = 'production';
    delete process.env.DB_DRIVER;

    let mockQueryCalled = false;
    const mockConn = {
      query: async (sql) => {
        mockQueryCalled = true;
        if (sql.includes('SHOW TABLES')) return [[]];
        return [[]];
      },
      release: () => {}
    };

    const mockPool = {
      getConnection: async () => mockConn,
      execute: async (sql, params) => [[{ test: 1 }]],
      end: async () => {}
    };

    _setConnectionFactoryForTesting(async () => ({ pool: mockPool, conn: mockConn }));

    await connectDB();
    assert(getDbMode() === 'mysql', 'Modo de base de datos es MYSQL');
    const queryRes = await query('SELECT 1');
    assert(Array.isArray(queryRes) && queryRes[0].test === 1, 'query() ejecuta correctamente contra MySQL');
    await closeDB();

    // -----------------------------------------------------------------
    // TEST 5: Fallo temporal de MySQL y recuperación con reintentos
    // -----------------------------------------------------------------
    console.log('\n--- 5. Fallo transitorio y recuperación tras reintentos ---');
    process.env.NODE_ENV = 'production';
    process.env.DB_RETRY_DELAY_MS = '10'; // Reducir delay para tests rápidos
    process.env.DB_CONNECT_RETRIES = '3';

    let attempts = 0;
    _setConnectionFactoryForTesting(async () => {
      attempts++;
      if (attempts < 3) {
        const transientErr = new Error('connect ECONNREFUSED 127.0.0.1:3306');
        transientErr.code = 'ECONNREFUSED';
        throw transientErr;
      }
      return { pool: mockPool, conn: mockConn };
    });

    await connectDB();
    assert(attempts === 3, `Se realizaron 3 intentos antes de conectar con éxito (intentos: ${attempts})`);
    assert(getDbMode() === 'mysql', 'Base de datos quedó conectada en modo MYSQL tras recuperarse');
    await closeDB();

    // -----------------------------------------------------------------
    // TEST 6: Agotamiento de reintentos en producción (NO fallback a SQLite)
    // -----------------------------------------------------------------
    console.log('\n--- 6. Agotamiento de reintentos en producción sin fallback a SQLite ---');
    process.env.NODE_ENV = 'production';
    process.env.DB_RETRY_DELAY_MS = '10';
    process.env.DB_CONNECT_RETRIES = '3';

    let failAttempts = 0;
    _setConnectionFactoryForTesting(async () => {
      failAttempts++;
      const transientErr = new Error('connect ECONNREFUSED 127.0.0.1:3306');
      transientErr.code = 'ECONNREFUSED';
      throw transientErr;
    });

    let threwAsExpected = false;
    try {
      await connectDB();
    } catch (err) {
      threwAsExpected = true;
      assert(err.message.includes('Falla de conexión a MySQL en producción'), `Lanza error explícito: ${err.message}`);
    }

    assert(threwAsExpected === true, 'connectDB lanzó excepción al agotar reintentos');
    assert(failAttempts === 3, `Se cumplieron exactamente los 3 intentos configurados (intentos: ${failAttempts})`);
    assert(getDbMode() !== 'sqlite', 'NUNCA se activó el modo SQLite en producción al fallar MySQL');

    // -----------------------------------------------------------------
    // TEST 7: Prohibición estricta de DB_DRIVER=sqlite en producción
    // -----------------------------------------------------------------
    console.log('\n--- 7. Prohibición estricta de DB_DRIVER=sqlite en producción ---');
    process.env.NODE_ENV = 'production';
    process.env.DB_DRIVER = 'sqlite';

    let threwSqliteBlocked = false;
    try {
      await connectDB();
    } catch (err) {
      threwSqliteBlocked = true;
      assert(
        err.message.includes('estrictamente prohibido en entornos de producción'),
        `Error de seguridad emitido: ${err.message}`
      );
    }
    assert(threwSqliteBlocked === true, 'Se bloquea arranque con SQLite configurado en producción');
    assert(getDbMode() !== 'sqlite', 'Modo SQLite no se activó');

    // -----------------------------------------------------------------
    // TEST 8: Uso permitido de SQLite en desarrollo local
    // -----------------------------------------------------------------
    console.log('\n--- 8. Uso permitido de SQLite en desarrollo local ---');
    restoreEnv();
    process.env.NODE_ENV = 'development';
    process.env.DB_DRIVER = 'sqlite';

    await connectDB();
    assert(getDbMode() === 'sqlite', 'Modo SQLite activado en desarrollo local con DB_DRIVER=sqlite');
    const sqliteRows = await query('SELECT COUNT(*) as total FROM usuarios');
    assert(Array.isArray(sqliteRows), 'SQLite responde consultas operativas correctamente');
    await closeDB();

    // -----------------------------------------------------------------
    // TEST 9: Error en desarrollo local si MySQL falla y SQLite NO está permitido
    // -----------------------------------------------------------------
    console.log('\n--- 9. MySQL no disponible en desarrollo sin permiso de SQLite ---');
    restoreEnv();
    process.env.NODE_ENV = 'development';
    delete process.env.DB_DRIVER;
    process.env.DB_RETRY_DELAY_MS = '10';
    process.env.DB_CONNECT_RETRIES = '2';

    _setConnectionFactoryForTesting(async () => {
      const connErr = new Error('connect ECONNREFUSED 127.0.0.1:3306');
      connErr.code = 'ECONNREFUSED';
      throw connErr;
    });

    let devThrew = false;
    try {
      await connectDB();
    } catch (err) {
      devThrew = true;
      assert(
        err.message.includes('SQLite no está expresamente permitido'),
        `Error claro para el desarrollador: ${err.message}`
      );
    }
    assert(devThrew === true, 'Lanza error en dev y NO recurre silenciosamente a SQLite');
    assert(getDbMode() !== 'sqlite', 'No se cambió el modo a sqlite de manera silenciosa');

  } finally {
    restoreEnv();
    await closeDB();
  }

  console.log('\n================================================================');
  console.log(`📊 RESULTADO AUDITORÍA DE SEGURIDAD: ${passed}/${total} pruebas superadas.`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditTests();
