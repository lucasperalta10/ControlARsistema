import { query } from '../config/db.js';
import { calcularPrecioGondola, validarDatosPrecio, calcularCostoRealConIva } from '../services/precioService.js';
import { registrarActividad } from '../services/actividadService.js';
import { getMargenPredeterminado } from '../services/configuracionService.js';

function calcularEstadoStock(stockActual, stockMinimo) {
  const stock = Number(stockActual);
  const min = Number(stockMinimo);

  if (stock <= 0) return 'AGOTADO';
  if (stock <= min) return 'REPONER';
  return 'DISPONIBLE';
}

export async function getProductos(req, res, next) {
  try {
    const { estado, categoria, buscar } = req.query;

    let sql = `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1
    `;
    const params = [];

    if (categoria) {
      sql += ' AND p.categoria_id = ?';
      params.push(Number(categoria));
    }

    if (buscar && buscar.trim() !== '') {
      sql += ' AND p.nombre LIKE ?';
      params.push(`%${buscar.trim()}%`);
    }

    sql += ' ORDER BY p.nombre ASC';

    const productos = await query(sql, params);

    // Mapear con estado de stock calculado y formateado
    let resultado = productos.map(p => ({
      ...p,
      precio_compra: Number(p.precio_compra),
      costo_real: Number(p.costo_real),
      margen_ganancia: Number(p.margen_ganancia),
      precio_gondola: Number(p.precio_gondola),
      stock_actual: Number(p.stock_actual),
      stock_minimo: Number(p.stock_minimo),
      estado_stock: calcularEstadoStock(p.stock_actual, p.stock_minimo)
    }));

    // Filtro por estado en memoria si se solicitó
    if (estado) {
      const estadoUpper = estado.trim().toUpperCase();
      resultado = resultado.filter(p => p.estado_stock === estadoUpper);
    }

    res.json({
      success: true,
      total: resultado.length,
      productos: resultado
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductoById(req, res, next) {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.activo = 1
    `, [Number(id)]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    const p = rows[0];
    const productoFormateado = {
      ...p,
      precio_compra: Number(p.precio_compra),
      costo_real: Number(p.costo_real),
      margen_ganancia: Number(p.margen_ganancia),
      precio_gondola: Number(p.precio_gondola),
      stock_actual: Number(p.stock_actual),
      stock_minimo: Number(p.stock_minimo),
      estado_stock: calcularEstadoStock(p.stock_actual, p.stock_minimo)
    };

    res.json({
      success: true,
      producto: productoFormateado
    });
  } catch (error) {
    next(error);
  }
}

export async function crearProducto(req, res, next) {
  try {
    const {
      nombre,
      categoria_id,
      unidad_venta,
      precio_compra,
      costo_real,
      margen_ganancia,
      stock_inicial = 0,
      stock_minimo = 0
    } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio.' });
    }

    const unidadesPermitidas = ['Unidad', 'Gramo', 'Kilogramo', 'Mililitro', 'Litro'];
    if (!unidad_venta || !unidadesPermitidas.includes(unidad_venta)) {
      return res.status(400).json({
        success: false,
        message: `La unidad de venta es obligatoria. Permitidas: ${unidadesPermitidas.join(', ')}`
      });
    }

    const finalCostoReal = Number(costo_real);
    const numPrecioCompra = precio_compra !== undefined ? (Number(precio_compra) || 0) : finalCostoReal;

    let finalMargen = margen_ganancia !== undefined && margen_ganancia !== null && margen_ganancia !== ''
      ? Number(margen_ganancia)
      : await getMargenPredeterminado();

    const validacion = validarDatosPrecio(finalCostoReal, finalMargen, numPrecioCompra);
    if (!validacion.valido) {
      return res.status(400).json({ success: false, message: validacion.errores.join(' ') });
    }

    const stockIni = Number(stock_inicial) || 0;
    const stockMin = Number(stock_minimo) || 0;

    if (stockIni < 0 || stockMin < 0) {
      return res.status(400).json({ success: false, message: 'El stock no puede ser negativo.' });
    }

    // Backend es la fuente de verdad del precio
    const precioGondola = calcularPrecioGondola(finalCostoReal, finalMargen);

    const insertSql = `
      INSERT INTO productos (
        nombre, categoria_id, unidad_venta, precio_compra, costo_real,
        margen_ganancia, precio_gondola, stock_actual, stock_minimo, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await query(insertSql, [
      nombre.trim(),
      categoria_id ? Number(categoria_id) : null,
      unidad_venta,
      numPrecioCompra,
      finalCostoReal,
      finalMargen,
      precioGondola,
      stockIni,
      stockMin
    ]);

    const nuevoId = result.insertId;

    // Si tiene stock inicial > 0, registrar movimiento de entrada inicial para que el historial sea 100% auditable
    if (stockIni > 0) {
      await query(`
        INSERT INTO movimientos_stock (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
        VALUES (?, ?, 'ENTRADA', ?, 0, ?, 'Carga inicial de producto')
      `, [nuevoId, req.user.id, stockIni, stockIni]);
    }

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'CREAR_PRODUCTO',
      entidad: 'PRODUCTO',
      entidadId: nuevoId,
      descripcion: `Creación del producto '${nombre.trim()}' con stock inicial ${stockIni} ${unidad_venta} y precio de góndola $${precioGondola}`
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      producto: {
        id: nuevoId,
        nombre: nombre.trim(),
        precio_gondola: precioGondola,
        stock_actual: stockIni,
        estado_stock: calcularEstadoStock(stockIni, stockMin)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function actualizarProducto(req, res, next) {
  try {
    const { id } = req.params;
    const pId = Number(id);

    // Verificar existencia
    const existentes = await query('SELECT * FROM productos WHERE id = ? AND activo = 1', [pId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    const anterior = existentes[0];
    const {
      nombre,
      categoria_id,
      unidad_venta,
      precio_compra,
      costo_real,
      margen_ganancia,
      stock_minimo
    } = req.body;

    if (nombre !== undefined && (!nombre || nombre.trim() === '')) {
      return res.status(400).json({ success: false, message: 'El nombre del producto no puede estar vacío.' });
    }

    const nuevoNombre = nombre ? nombre.trim() : anterior.nombre;
    const nuevaCategoria = categoria_id !== undefined ? (categoria_id ? Number(categoria_id) : null) : anterior.categoria_id;
    const nuevaUnidad = unidad_venta || anterior.unidad_venta;
    const nuevoCostoReal = costo_real !== undefined ? Number(costo_real) : Number(anterior.costo_real);
    const nuevoPrecioCompra = precio_compra !== undefined ? Number(precio_compra) : nuevoCostoReal;
    const nuevoMargen = margen_ganancia !== undefined ? Number(margen_ganancia) : Number(anterior.margen_ganancia);
    const nuevoStockMin = stock_minimo !== undefined ? Number(stock_minimo) : Number(anterior.stock_minimo);

    const validacion = validarDatosPrecio(nuevoCostoReal, nuevoMargen, nuevoPrecioCompra);
    if (!validacion.valido) {
      return res.status(400).json({ success: false, message: validacion.errores.join(' ') });
    }

    if (nuevoStockMin < 0) {
      return res.status(400).json({ success: false, message: 'El stock mínimo no puede ser negativo.' });
    }

    // Regla Sección 32: Prohibido modificar stock_actual por edición general
    const precioGondola = calcularPrecioGondola(nuevoCostoReal, nuevoMargen);

    const updateSql = `
      UPDATE productos SET
        nombre = ?,
        categoria_id = ?,
        unidad_venta = ?,
        precio_compra = ?,
        costo_real = ?,
        margen_ganancia = ?,
        precio_gondola = ?,
        stock_minimo = ?,
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateSql, [
      nuevoNombre,
      nuevaCategoria,
      nuevaUnidad,
      nuevoPrecioCompra,
      nuevoCostoReal,
      nuevoMargen,
      precioGondola,
      nuevoStockMin,
      pId
    ]);

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'EDITAR_PRODUCTO',
      entidad: 'PRODUCTO',
      entidadId: pId,
      descripcion: `Edición de datos del producto '${nuevoNombre}'. Nuevo precio góndola: $${precioGondola}`
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      producto: {
        id: pId,
        nombre: nuevoNombre,
        precio_gondola: precioGondola,
        stock_actual: Number(anterior.stock_actual),
        estado_stock: calcularEstadoStock(anterior.stock_actual, nuevoStockMin)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function desactivarProducto(req, res, next) {
  try {
    const { id } = req.params;
    const pId = Number(id);

    const existentes = await query('SELECT * FROM productos WHERE id = ? AND activo = 1', [pId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    const producto = existentes[0];

    // Desactivación lógica (activo = 0)
    await query('UPDATE productos SET activo = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [pId]);

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'DESACTIVAR_PRODUCTO',
      entidad: 'PRODUCTO',
      entidadId: pId,
      descripcion: `Desactivación lógica del producto '${producto.nombre}' (id: ${pId})`
    });

    res.json({
      success: true,
      message: `El producto '${producto.nombre}' fue desactivado correctamente.`
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  desactivarProducto
};
