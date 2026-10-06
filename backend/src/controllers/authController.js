import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { registrarActividad } from '../services/actividadService.js';

export async function login(req, res, next) {
  try {
    const { dni, pin } = req.body;

    if (!dni || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingresá tu DNI y tu PIN.'
      });
    }

    const cleanDni = String(dni).trim();
    const cleanPin = String(pin).trim();

    const users = await query('SELECT * FROM usuarios WHERE dni = ?', [cleanDni]);
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'DNI o PIN incorrecto. Verificá los datos ingresados.'
      });
    }

    const usuario = users[0];

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra inactiva. Comunicate con el administrador.'
      });
    }

    const pinValido = await bcrypt.compare(cleanPin, usuario.pin_hash);
    if (!pinValido) {
      return res.status(401).json({
        success: false,
        message: 'DNI o PIN incorrecto. Verificá los datos ingresados.'
      });
    }

    // Actualizar último acceso
    await query('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

    // Registrar en actividad
    await registrarActividad({
      usuarioId: usuario.id,
      accion: 'LOGIN',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      descripcion: `Inicio de sesión exitoso de ${usuario.nombre} ${usuario.apellido}`
    });

    // Generar JWT
    const secret = process.env.JWT_SECRET || 'super_secreto_controlar_2026_jwt_token_victoria_artesanales';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        id: usuario.id,
        dni: usuario.dni,
        rol: usuario.rol
      },
      secret,
      { expiresIn }
    );

    // Responder sin exponer el PIN
    res.json({
      success: true,
      message: `¡Bienvenida/o, ${usuario.nombre}!`,
      token,
      usuario: {
        id: usuario.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        puede_gestionar_categorias: usuario.puede_gestionar_categorias ? 1 : 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  // Con JWT desacoplado el frontend descarta el token
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente.'
  });
}

export async function me(req, res) {
  // req.user viene del middleware
  res.json({
    success: true,
    usuario: {
      id: req.user.id,
      dni: req.user.dni,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      rol: req.user.rol,
      puede_gestionar_categorias: req.user.puede_gestionar_categorias ? 1 : 0
    }
  });
}

export async function cambiarPin(req, res, next) {
  try {
    const { pinActual, pinNuevo } = req.body;
    const usuarioId = req.user.id;

    if (!pinActual || !pinNuevo) {
      return res.status(400).json({
        success: false,
        message: 'Debés ingresar el PIN actual y el nuevo PIN.'
      });
    }

    const cleanActual = String(pinActual).trim();
    const cleanNuevo = String(pinNuevo).trim();

    if (cleanNuevo.length < 4 || cleanNuevo.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo PIN debe tener entre 4 y 8 dígitos.'
      });
    }

    const rows = await query('SELECT pin_hash FROM usuarios WHERE id = ?', [usuarioId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const pinValido = await bcrypt.compare(cleanActual, rows[0].pin_hash);
    if (!pinValido) {
      return res.status(400).json({
        success: false,
        message: 'El PIN actual ingresado no es correcto.'
      });
    }

    const nuevoHash = await bcrypt.hash(cleanNuevo, 10);
    await query('UPDATE usuarios SET pin_hash = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [nuevoHash, usuarioId]);

    await registrarActividad({
      usuarioId,
      accion: 'CAMBIO_PIN',
      entidad: 'USUARIO',
      entidadId: usuarioId,
      descripcion: `El usuario ${req.user.nombre} ${req.user.apellido} cambió su propio PIN.`
    });

    res.json({
      success: true,
      message: 'Tu PIN fue actualizado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

export default {
  login,
  logout,
  me,
  cambiarPin
};
