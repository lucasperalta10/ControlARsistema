import { connectDB, query } from '../config/db.js';
import { calcularPrecioGondola } from '../services/precioService.js';

async function seedData() {
  await connectDB();

  // Categorías
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
    try {
      await query(
        'INSERT IGNORE INTO categorias (id, nombre, margen_predeterminado, activo) VALUES (?, ?, ?, ?)',
        c
      );
    } catch (e) {
      console.error('Error insertando categoria', e.message);
    }
  }

  // Productos demostrativos basados en la especificación de controlar.md:
  // 1. Snack Frutos Secos (400g bolsa, costo unitario por gramo = $10, margen 60% -> $25 por gramo, stock 120g, min 200g -> REPONER)
  // 2. Jugo de Naranja 1L (costo $600, margen 40% -> $1000, stock 2, min 5 -> REPONER)
  // 3. Yogur Natural Artesanal (costo $900, margen 40% -> $1500, stock 1, min 4 -> REPONER)
  // 4. Hamburguesas Caseras (kg, costo $4400, margen 45% -> $8000, stock 0, min 2.5 -> AGOTADO)
  // 5. Detergente Artesanal 500ml (costo $1300, margen 35% -> $2000, stock 15, min 5 -> DISPONIBLE)
  // 6. Bebida Cola Artesanal 1.5L (costo $1200, margen 40% -> $2000, stock 24, min 10 -> DISPONIBLE)
  // 7. Alfajor Artesanal Chocolate (costo $500, margen 50% -> $1000, stock 30, min 10 -> DISPONIBLE)

  const demo = [
    {
      id: 1,
      nombre: 'Snack Frutos Secos',
      categoria_id: 1,
      unidad_venta: 'Gramo',
      precio_compra: 10.0,
      costo_real: 10.0,
      margen_ganancia: 60.0,
      stock_actual: 120.0,
      stock_minimo: 200.0
    },
    {
      id: 2,
      nombre: 'Jugo de Naranja 1L',
      categoria_id: 2,
      unidad_venta: 'Unidad',
      precio_compra: 600.0,
      costo_real: 600.0,
      margen_ganancia: 40.0,
      stock_actual: 2.0,
      stock_minimo: 5.0
    },
    {
      id: 3,
      nombre: 'Yogur Natural Artesanal',
      categoria_id: 7,
      unidad_venta: 'Unidad',
      precio_compra: 900.0,
      costo_real: 900.0,
      margen_ganancia: 40.0,
      stock_actual: 1.0,
      stock_minimo: 4.0
    },
    {
      id: 4,
      nombre: 'Hamburguesas Caseras Congeladas',
      categoria_id: 6,
      unidad_venta: 'Kilogramo',
      precio_compra: 4400.0,
      costo_real: 4400.0,
      margen_ganancia: 45.0,
      stock_actual: 0.0,
      stock_minimo: 2.5
    },
    {
      id: 5,
      nombre: 'Detergente Artesanal 500ml',
      categoria_id: 3,
      unidad_venta: 'Unidad',
      precio_compra: 1300.0,
      costo_real: 1300.0,
      margen_ganancia: 35.0,
      stock_actual: 15.0,
      stock_minimo: 5.0
    },
    {
      id: 6,
      nombre: 'Bebida Cola Artesanal 1.5L',
      categoria_id: 4,
      unidad_venta: 'Unidad',
      precio_compra: 1200.0,
      costo_real: 1200.0,
      margen_ganancia: 40.0,
      stock_actual: 24.0,
      stock_minimo: 10.0
    },
    {
      id: 7,
      nombre: 'Alfajor Artesanal Chocolate',
      categoria_id: 5,
      unidad_venta: 'Unidad',
      precio_compra: 500.0,
      costo_real: 500.0,
      margen_ganancia: 50.0,
      stock_actual: 30.0,
      stock_minimo: 10.0
    }
  ];

  for (const p of demo) {
    const precioGondola = calcularPrecioGondola(p.costo_real, p.margen_ganancia);
    try {
      await query(
        `INSERT IGNORE INTO productos (id, nombre, categoria_id, unidad_venta, precio_compra, costo_real, margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          p.id,
          p.nombre,
          p.categoria_id,
          p.unidad_venta,
          p.precio_compra,
          p.costo_real,
          p.margen_ganancia,
          precioGondola,
          p.stock_actual,
          p.stock_minimo
        ]
      );
    } catch (e) {
      console.error('Error insertando producto demo', e.message);
    }
  }

  console.log('✅ Semillas de categorías y productos insertadas con éxito.');
  process.exit(0);
}

seedData();
