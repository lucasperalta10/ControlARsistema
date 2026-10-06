import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { registrarActividad } from '../services/actividadService.js';

export async function getUsuarios(req, res, next) {
  try {
    const rows = await query(`
      SELECT id, dni, nombre, apellido, rol, puede_gestionar_categorias, activo, ultimo_acceso, creado_en
      FROM usuarios
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      total: rows.length,
      usuarios: rows.map(u => ({
        ...u,
        puede_gestionar_categorias: u.puede_gestionar_categorias ? 1 : 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsuarioById(req, res, next) {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT id, dni, nombre, apellido, rol, puede_gestionar_categorias, activo, ultimo_acceso, creado_en
      FROM usuarios
      WHERE id = ?
    `, [Number(id)]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const u = rows[0];
    res.json({
      success: true,
      usuario: {
        ...u,
        puede_gestionar_categorias: u.puede_gestionar_categorias ? 1 : 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function crearUsuario(req, res, next) {
  try {
    const { dni, nombre, apellido, pin, rol = 'USUARIO', puede_gestionar_categorias = false } = req.body;

    if (!dni || !nombre || !apellido || !pin) {
      return res.status(400).json({
        success: false,
        message: 'DNI, Nombre, Apellido y PIN son campos obligatorios.'
      });
    }

    const cleanDni = String(dni).trim();
    const cleanPin = String(pin).trim();
    const cleanRol = rol === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USUARIO';
    const cleanPuedeGestionar = (cleanRol === 'SUPER_ADMIN' || puede_gestionar_categorias) ? 1 : 0;

    if (cleanPin.length < 4 || cleanPin.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'El PIN debe tener entre 4 y 8 dígitos.'
      });
    }

    // Verificar si DNI ya existe
    const existentes = await query('SELECT id FROM usuarios WHERE dni = ?', [cleanDni]);
    if (existentes && existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un usuario con el DNI ${cleanDni}.`
      });
    }

    const pinHash = await bcrypt.hash(cleanPin, 10);

    const result = await query(
      `INSERT INTO usuarios (dni, nombre, apellido, pin_hash, rol, puede_gestionar_categorias, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [cleanDni, nombre.trim(), apellido.trim(), pinHash, cleanRol, cleanPuedeGestionar]
    );

    const nuevoId = result.insertId;

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'CREAR_USUARIO',
      entidad: 'USUARIO',
      entidadId: nuevoId,
      descripcion: `Creación del usuario ${nombre.trim()} ${apellido.trim()} (DNI: ${cleanDni}, Rol: ${cleanRol}, Permiso Categorías: ${cleanPuedeGestionar ? 'SÍ' : 'NO'})`
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      usuario: {
        id: nuevoId,
        dni: cleanDni,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rol: cleanRol,
        puede_gestionar_categorias: cleanPuedeGestionar,
        activo: 1
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function actualizarUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, apellido, rol, puede_gestionar_categorias } = req.body;
    const uId = Number(id);

    const existentes = await query('SELECT * FROM usuarios WHERE id = ?', [uId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const usuario = existentes[0];
    const nuevoNombre = nombre ? nombre.trim() : usuario.nombre;
    const nuevoApellido = apellido ? apellido.trim() : usuario.apellido;
    const nuevoRol = rol ? (rol === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USUARIO') : usuario.rol;
    const nuevoPuedeGestionar = puede_gestionar_categorias !== undefined
      ? (puede_gestionar_categorias ? 1 : 0)
      : (usuario.puede_gestionar_categorias ? 1 : 0);

    await query(
      `UPDATE usuarios SET nombre = ?, apellido = ?, rol = ?, puede_gestionar_categorias = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      [nuevoNombre, nuevoApellido, nuevoRol, nuevoPuedeGestionar, uId]
    );

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'EDITAR_USUARIO',
      entidad: 'USUARIO',
      entidadId: uId,
      descripcion: `Modificación de datos del usuario id ${uId}: ${nuevoNombre} ${nuevoApellido} (${nuevoRol}, Permiso Categorías: ${nuevoPuedeGestionar ? 'SÍ' : 'NO'})`
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

export async function cambiarEstadoUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const uId = Number(id);

    if (uId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No podés desactivar tu propia cuenta administradora.'
      });
    }

    const existentes = await query('SELECT * FROM usuarios WHERE id = ?', [uId]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const nuevoEstado = activo ? 1 : 0;
    await query('UPDATE usuarios SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [nuevoEstado, uId]);

    await registrarActividad({
      usuarioId: req.user.id,
      accion: nuevoEstado === 1 ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
      entidad: 'USUARIO',
      entidadId: uId,
      descripcion: `Cambio de estado del usuario id ${uId} a ${nuevoEstado === 1 ? 'ACTIVO' : 'INACTIVO'}`
    });

    res.json({
      success: true,
      message: `El usuario ahora está ${nuevoEstado === 1 ? 'activo' : 'inactivo'}.`
    });
  } catch (error) {
    next(error);
  }
}

export async function resetearPin(req, res, next) {
  try {
    const { id } = req.params;
    const { nuevoPin } = req.body;
    const uId = Number(id);

    if (!nuevoPin || String(nuevoPin).trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo PIN debe tener al menos 4 dígitos.'
      });
    }

    const cleanPin = String(nuevoPin).trim();
    const hash = await bcrypt.hash(cleanPin, 10);

    await query('UPDATE usuarios SET pin_hash = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [hash, uId]);

    await registrarActividad({
      usuarioId: req.user.id,
      accion: 'RESET_PIN',
      entidad: 'USUARIO',
      entidadId: uId,
      descripcion: `Reset de PIN del usuario id ${uId} por SUPER_ADMIN`
    });

    res.json({
      success: true,
      message: 'PIN restablecido exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  resetearPin
};
