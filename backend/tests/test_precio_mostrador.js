import { calcularPrecioMostrador, calcularPrecioGondola, validarDatosPrecio } from '../src/services/precioService.js';
import { calculateMostradorPreview } from '../../frontend/src/utils/formatters.js';
import { connectDB, query } from '../src/config/db.js';
import { getMargenPredeterminado, setMargenPredeterminado } from '../src/services/configuracionService.js';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PRUEBAS MATEMÁTICAS Y DE REGRESIÓN: PRECIO DE MOSTRADOR');
  console.log('   Victoria Productos Artesanales — ControlAR v1.0');
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

  // --- 1. PRUEBAS MATEMÁTICAS ESPECIFICADAS POR EL USUARIO ---
  console.log('--- 1. Casos de negocio solicitados expresamente ---');
  
  // Caso 1: Compra de $10.000 con recargo del 50% -> $15.000
  const caso1 = calcularPrecioMostrador(10000, 50);
  assert(caso1 === 15000, `Compra $10.000 con recargo 50% = $15.000 (obtenido: $${caso1})`);

  // Caso 2: Compra de $10.000 con recargo del 60% -> $16.000
  const caso2 = calcularPrecioMostrador(10000, 60);
  assert(caso2 === 16000, `Compra $10.000 con recargo 60% = $16.000 (obtenido: $${caso2})`);

  // Caso 3: Compra de $10.000 con recargo del 30% -> $13.000
  const caso3 = calcularPrecioMostrador(10000, 30);
  assert(caso3 === 13000, `Compra $10.000 con recargo 30% = $13.000 (obtenido: $${caso3})`);

  // Caso 4: Costo $0
  const casoCero = calcularPrecioMostrador(0, 50);
  assert(casoCero === 0, `Compra $0 con recargo 50% = $0 (obtenido: $${casoCero})`);

  // Caso 5: Recargo del 100% (duplica costo: $10.000 -> $20.000)
  const caso100 = calcularPrecioMostrador(10000, 100);
  assert(caso100 === 20000, `Compra $10.000 con recargo 100% = $20.000 (obtenido: $${caso100})`);

  // Caso 6: Alias calcularPrecioGondola es idéntico a calcularPrecioMostrador
  const casoAlias = calcularPrecioGondola(10000, 50);
  assert(casoAlias === 15000, `Alias calcularPrecioGondola(10000, 50) = $15.000 (obtenido: $${casoAlias})`);

  // Caso 7: Frontend formatter helper
  const frontendPreview = calculateMostradorPreview(10000, 50);
  assert(frontendPreview === 15000, `Frontend calculateMostradorPreview(10000, 50) = $15.000 (obtenido: $${frontendPreview})`);

  // --- 2. VALIDACIONES DE ENTRADA Y LIMITES ---
  console.log('\n--- 2. Validaciones de valores inválidos y límites ---');

  // Negativo en costo
  let errorCostoNegativo = false;
  try {
    calcularPrecioMostrador(-100, 50);
  } catch (e) {
    errorCostoNegativo = true;
  }
  assert(errorCostoNegativo, 'calcularPrecioMostrador rechaza costo negativo');

  // Negativo en recargo
  let errorRecargoNegativo = false;
  try {
    calcularPrecioMostrador(10000, -10);
  } catch (e) {
    errorRecargoNegativo = true;
  }
  assert(errorRecargoNegativo, 'calcularPrecioMostrador rechaza porcentaje negativo');

  // Helper validarDatosPrecio
  const validacionNegativos = validarDatosPrecio(-50, -20);
  assert(!validacionNegativos.valido && validacionNegativos.errores.length === 2, 'validarDatosPrecio rechaza costo y margen negativos');

  const validacionOk = validarDatosPrecio(10000, 50);
  assert(validacionOk.valido && validacionOk.errores.length === 0, 'validarDatosPrecio acepta valores correctos');

  // --- 3. PRUEBA DE PERSISTENCIA Y NO-ALTERACIÓN DE PRODUCTOS EXISTENTES ---
  console.log('\n--- 3. Prueba de base de datos: preservación de datos existentes ---');
  try {
    await connectDB();
    // Asegurar 50% inicial
    await setMargenPredeterminado(50);
    const inicial = await getMargenPredeterminado();
    assert(inicial === 50, `Configuración predeterminada inicial en BD es 50% (obtenido: ${inicial}%)`);

    // Crear producto existente A con 50%
    const costoA = 10000;
    const margenA = 50;
    const precioA = calcularPrecioMostrador(costoA, margenA); // $15.000
    
    // Limpiar tests previos si existen
    await query("DELETE FROM productos WHERE nombre LIKE 'TEST_MOSTRADOR_%'");

    const insertRes = await query(`
      INSERT INTO productos (nombre, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
      VALUES ('TEST_MOSTRADOR_PRODUCTO_A', 'Unidad', ?, ?, ?, ?, 10, 5, 1)
    `, [costoA, costoA, margenA, precioA]);
    const idA = insertRes.insertId;
    assert(!!idA, `Producto A registrado con id=${idA}, costo=$${costoA}, recargo=${margenA}%, precio=$${precioA}`);

    // Modificar porcentaje predeterminado del sistema a 60%
    await setMargenPredeterminado(60);
    const nuevoDef = await getMargenPredeterminado();
    assert(nuevoDef === 60, `Porcentaje predeterminado actualizado en BD a 60%`);

    // Verificar que Producto A NO sufrió cambios
    const [prodAConsultado] = await query('SELECT id, nombre, costo_real, margen_ganancia, precio_gondola FROM productos WHERE id = ?', [idA]);
    assert(
      Number(prodAConsultado.margen_ganancia) === 50 && Number(prodAConsultado.precio_gondola) === 15000,
      `Producto existente A conservó su recargo intacto (50%) y precio intacto ($15.000)`
    );

    // Crear Producto B con el nuevo predeterminado (60%)
    const costoB = 10000;
    const margenB = nuevoDef;
    const precioB = calcularPrecioMostrador(costoB, margenB); // $16.000
    const insertResB = await query(`
      INSERT INTO productos (nombre, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
      VALUES ('TEST_MOSTRADOR_PRODUCTO_B', 'Unidad', ?, ?, ?, ?, 5, 2, 1)
    `, [costoB, costoB, margenB, precioB]);
    const idB = insertResB.insertId;

    const [prodBConsultado] = await query('SELECT id, nombre, costo_real, margen_ganancia, precio_gondola FROM productos WHERE id = ?', [idB]);
    assert(
      Number(prodBConsultado.margen_ganancia) === 60 && Number(prodBConsultado.precio_gondola) === 16000,
      `Producto nuevo B se creó con el recargo vigente (60%) y precio proyectado ($16.000)`
    );

    // Limpieza de datos de prueba
    await query("DELETE FROM productos WHERE nombre LIKE 'TEST_MOSTRADOR_%'");
    // Restablecer margen predeterminado a 50%
    await setMargenPredeterminado(50);
    console.log('🧹 Limpieza de registros temporales completada.');

  } catch (dbErr) {
    console.error('Error durante prueba de base de datos:', dbErr);
    process.exitCode = 1;
  }

  console.log('\n================================================================');
  console.log(`📊 RESULTADO FINAL: ${passed}/${total} pruebas superadas.`);
  console.log('================================================================\n');

  process.exit(process.exitCode || 0);
}

runTests();
