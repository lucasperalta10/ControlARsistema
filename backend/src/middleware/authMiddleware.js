import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export async function authMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Iniciá sesión para continuar.'
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secreto_controlar_2026_jwt_token_victoria_artesanales';
    const decoded = jwt.verify(token, secret);

    const rows = await query('SELECT id, dni, nombre, apellido, rol, puede_gestionar_categorias, activo FROM usuarios WHERE id = ?', [decoded.id]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o sesión inválida.'
      });
    }

    const usuario = rows[0];
    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Consultá con el administrador.'
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Tu sesión ha expirado. Por favor, volvé a iniciar sesión.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación inválido.'
    });
  }
}

export default authMiddleware;
