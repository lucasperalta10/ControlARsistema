import { query } from '../config/db.js';
import { registrarActividad } from '../services/actividadService.js';

export async function getCategorias(req, res, next) {
  try {
    const { todas } = req.query;
    // Por defecto devuelve activas. Si SUPER_ADMIN pasa ?todas=true, devuelve todas
    let sql = `
      SELECT c.*, COUNT(p.id) AS total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
    `;

    if (!todas) {
      sql += ' WHERE c.activo = 1';
    }

    sql += ' GROUP BY c.id ORDER BY c.nombre ASC';

    const rows = await query(sql);
    const categorias = rows.map(c => ({
      ...c,
      margen_predeterminado: c.margen_predeterminado !== null ? Number(c.margen_predeterminado) : null,
      total_productos: Number(c.total_productos)
    }));

    res.json({
      success: true,
      total: categorias.length,
      categorias
    });
  } catch (error) {
    next(error);
  }
}

export async function crearCategoria(req, res, next) {
  try {
    const { nombre, margen_predeterminado } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio.' });
    }

    const cleanNombre = nombre.trim();
    let margen = null;

    if (margen_predeterminado !== undefined && margen_predeterminado !== null && margen_predeterminado !== '') {
      margen = Number(margen_predeterminado);
      if (isNaN(margen) || margen < 0 || margen > 999.99) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje predeterminado debe ser un número mayor o igual a 0% o ser nulo.'
        });
      }
    }

    // Verificar nombre único
    const existentes = await query('SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)', [cleanNombre]);
    if (existentes && existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una categoría con el nombre '${cleanNombre}'.`
      });
    }

    const result = await query(
      'INSERT INTO categorias (nombre, margen_predeterminado, activo) VALUES (?, ?, 1)',
      [cleanNombre, margen]
    );

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'CREAR_CATEGORIA',
      entidad: 'CATEGORIA',
      entidadId: result.insertId,
      descripcion: `Creación de la categoría '${cleanNombre}' con margen sugerido ${margen !== null ? margen + '%' : 'Ninguno'}`
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente.',
      categoria: {
        id: result.insertId,
        nombre: cleanNombre,
        margen_predeterminado: margen,
        activo: 1
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function actualizarCategoria(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, margen_predeterminado } = req.body;
    const catId = Number(id);

    const existentes = await query('SELECT * FROM categorias WHERE id = ?', [catId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    }

    const actual = existentes[0];
    const nuevoNombre = nombre ? nombre.trim() : actual.nombre;
    let nuevoMargen = actual.margen_predeterminado;

    if (margen_predeterminado !== undefined) {
      if (margen_predeterminado === null || margen_predeterminado === '') {
        nuevoMargen = null;
      } else {
        nuevoMargen = Number(margen_predeterminado);
        if (isNaN(nuevoMargen) || nuevoMargen < 0 || nuevoMargen > 999.99) {
          return res.status(400).json({
            success: false,
            message: 'El porcentaje predeterminado debe ser un número mayor o igual a 0% o ser nulo.'
          });
        }
      }
    }

    await query(
      'UPDATE categorias SET nombre = ?, margen_predeterminado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoNombre, nuevoMargen, catId]
    );

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'EDITAR_CATEGORIA',
      entidad: 'CATEGORIA',
      entidadId: catId,
      descripcion: `Modificación de categoría '${nuevoNombre}'`
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

export async function desactivarCategoria(req, res, next) {
  try {
    const { id } = req.params;
    const catId = Number(id);
    const { mover_a_categoria_id } = req.body || {};

    const existentes = await query('SELECT * FROM categorias WHERE id = ?', [catId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    }

    const categoria = existentes[0];

    // Verificar productos asociados a esta categoría
    const prodsAsociados = await query(
      'SELECT COUNT(id) AS total FROM productos WHERE categoria_id = ? AND activo = 1',
      [catId]
    );
    const totalProductos = Number(prodsAsociados[0]?.total || 0);

    if (totalProductos > 0) {
      if (!mover_a_categoria_id) {
        return res.status(400).json({
          success: false,
          requiere_mover: true,
          total_productos: totalProductos,
          message: `Esta categoría tiene ${totalProductos} producto${totalProductos === 1 ? '' : 's'} asociado${totalProductos === 1 ? '' : 's'}. Debés mover los productos a otra categoría antes de eliminarla.`
        });
      }

      const destinoId = Number(mover_a_categoria_id);
      if (destinoId === catId) {
        return res.status(400).json({
          success: false,
          message: 'La categoría de destino no puede ser la misma categoría que se desea eliminar.'
        });
      }

      const catDestino = await query('SELECT * FROM categorias WHERE id = ? AND activo = 1', [destinoId]);
      if (!catDestino || catDestino.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La categoría de destino seleccionada no existe o está inactiva.'
        });
      }

      // Mover todos los productos a la categoría seleccionada
      await query(
        'UPDATE productos SET categoria_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE categoria_id = ?',
        [destinoId, catId]
      );

      await registrarActividad({
        usuarioId: req.user.id,
        accion: 'MOVER_PRODUCTOS_CATEGORIA',
        entidad: 'CATEGORIA',
        entidadId: catId,
        descripcion: `Se reasignaron ${totalProductos} producto(s) de '${categoria.nombre}' hacia '${catDestino[0].nombre}'`
      });
    }

    // Desactivación lógica de la categoría
    await query('UPDATE categorias SET activo = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [catId]);

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'DESACTIVAR_CATEGORIA',
      entidad: 'CATEGORIA',
      entidadId: catId,
      descripcion: `Eliminación lógica de la categoría '${categoria.nombre}'${totalProductos > 0 ? ` (se movieron ${totalProductos} productos)` : ''}`
    });

    res.json({
      success: true,
      message: totalProductos > 0
        ? `Categoría '${categoria.nombre}' eliminada. Se movieron ${totalProductos} producto(s) a la nueva categoría.`
        : `Categoría '${categoria.nombre}' eliminada exitosamente.`
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria
};
