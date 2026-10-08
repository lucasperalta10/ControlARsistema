import { connectDB, query } from '../src/config/db.js';
import { getMargenPredeterminado, setMargenPredeterminado } from '../src/services/configuracionService.js';
import { calcularPrecioGondola } from '../src/services/precioService.js';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Iniciando Test: Regla de Porcentaje Predeterminado');
  console.log('====================================================\n');

  try {
    await connectDB();

    // 1. Verificar margen predeterminado inicial (debe ser 50% por defecto)
    let margenInicial = await getMargenPredeterminado();
    console.log(`[Paso 1] Margen predeterminado inicial leído: ${margenInicial}%`);
    if (margenInicial !== 50) {
      console.log(`Restableciendo a 50% para inicio del test...`);
      await setMargenPredeterminado(50);
      margenInicial = await getMargenPredeterminado();
    }
    if (margenInicial !== 50) {
      throw new Error(`Esperado 50%, obtenido ${margenInicial}%`);
    }
    console.log('✅ Paso 1 superado: Margen inicial configurado en 50%.\n');

    // 2. Crear un producto existente (Producto A) con el margen vigente del 50%
    const costoA = 1000.0;
    const precioGondolaA = calcularPrecioGondola(costoA, margenInicial); // 1000 * (1 + 0.50) = 1500.00
    
    // Limpiar productos de test previos si existieran
    await query("DELETE FROM productos WHERE nombre LIKE 'TEST_PRODUCTO_%'");

    const insertARes = await query(`
      INSERT INTO productos (nombre, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
      VALUES ('TEST_PRODUCTO_A', 'Unidad', ?, ?, ?, ?, 10, 2, 1)
    `, [costoA, costoA, margenInicial, precioGondolaA]);

    const idA = insertARes.insertId;
    console.log(`[Paso 2] Producto A creado con id ${idA}:`);
    console.log(`        Costo Real: $${costoA}`);
    console.log(`        Margen: ${margenInicial}%`);
    console.log(`        Precio Mostrador: $${precioGondolaA}`);
    console.log('✅ Paso 2 superado: Producto A registrado con margen 50% y precio $1500.00.\n');

    // 3. Cambiar el margen predeterminado del sistema del 50% al 60%
    console.log('[Paso 3] Cambiando el margen predeterminado del sistema de 50% a 60%...');
    const nuevoMargenConfigurado = await setMargenPredeterminado(60);
    const margenLeidoPostCambio = await getMargenPredeterminado();
    
    if (nuevoMargenConfigurado !== 60 || margenLeidoPostCambio !== 60) {
      throw new Error(`Fallo al cambiar configuración: esperado 60%, obtenido ${margenLeidoPostCambio}%`);
    }
    console.log(`✅ Paso 3 superado: Nueva configuración vigente establecida en ${margenLeidoPostCambio}%.\n`);

    // 4. VERIFICACIÓN CRÍTICA: El Producto A existente NO debe haberse alterado
    console.log('[Paso 4] Verificando que Producto A NO haya sido modificado por el cambio de configuración...');
    const filasA = await query('SELECT id, nombre, costo_real, margen_ganancia, precio_gondola FROM productos WHERE id = ?', [idA]);
    const prodAActual = filasA[0];

    console.log(`        Producto A actual en base de datos:`);
    console.log(`        Margen: ${Number(prodAActual.margen_ganancia)}% (esperado: 50%)`);
    console.log(`        Precio Mostrador: $${Number(prodAActual.precio_gondola)} (esperado: $1500.00)`);

    if (Number(prodAActual.margen_ganancia) !== 50 || Number(prodAActual.precio_gondola) !== 1500) {
      throw new Error('❌ FALLO CRÍTICO: El Producto A existente fue alterado tras cambiar la configuración predeterminada.');
    }
    console.log('✅ Paso 4 superado: El Producto A preservó su margen (50%) y precio ($1500) intactos.\n');

    // 5. Crear Producto B utilizando la nueva configuración predeterminada (60%)
    console.log('[Paso 5] Creando Producto B usando el nuevo margen vigente (60%)...');
    const costoB = 1000.0;
    const precioGondolaB = calcularPrecioGondola(costoB, margenLeidoPostCambio); // 1000 * (1 + 0.60) = 1600.00

    const insertBRes = await query(`
      INSERT INTO productos (nombre, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
      VALUES ('TEST_PRODUCTO_B', 'Unidad', ?, ?, ?, ?, 10, 2, 1)
    `, [costoB, costoB, margenLeidoPostCambio, precioGondolaB]);

    const idB = insertBRes.insertId;
    console.log(`        Producto B creado con id ${idB}:`);
    console.log(`        Costo Real: $${costoB}`);
    console.log(`        Margen: ${margenLeidoPostCambio}%`);
    console.log(`        Precio Mostrador: $${precioGondolaB}`);
    console.log('✅ Paso 5 superado: Producto B adoptó el nuevo porcentaje predeterminado del 60% ($1600.00).\n');

    // 6. Verificación final cruzada
    const checkTodos = await query("SELECT id, nombre, margen_ganancia, precio_gondola FROM productos WHERE nombre IN ('TEST_PRODUCTO_A', 'TEST_PRODUCTO_B') ORDER BY id ASC");
    console.log('[Paso 6] Comparación final en BD:');
    for (const p of checkTodos) {
      console.log(`   - ${p.nombre}: Margen = ${Number(p.margen_ganancia)}%, Góndola = $${Number(p.precio_gondola)}`);
    }

    if (Number(checkTodos[0].margen_ganancia) !== 50 || Number(checkTodos[1].margen_ganancia) !== 60) {
      throw new Error('❌ Inconsistencia en la comparación cruzada.');
    }

    // Limpieza
    await query("DELETE FROM productos WHERE nombre IN ('TEST_PRODUCTO_A', 'TEST_PRODUCTO_B')");
    // Restablecer margen inicial a 50% para producción
    await setMargenPredeterminado(50);
    console.log('\n🧹 Limpieza completada y configuración restablecida a 50% inicial.');
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS:', error);
    process.exit(1);
  }
}

runTests();
