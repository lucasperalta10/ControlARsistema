export function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado.'
    });
  }

  if (req.user.rol !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No tenés permisos para realizar esta acción. Esta función requiere perfil de Administrador.'
    });
  }

  next();
}

export function requireGestionCategorias(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado.'
    });
  }

  // Permitir a Administradores o usuarios con permiso explícito de categorías
  const tienePermiso = req.user.rol === 'SUPER_ADMIN' || req.user.puede_gestionar_categorias === 1 || req.user.puede_gestionar_categorias === true;
  if (!tienePermiso) {
    return res.status(403).json({
      success: false,
      message: 'No tenés permisos para gestionar categorías. Solicitá autorización a un Administrador.'
    });
  }

  next();
}

export default {
  requireSuperAdmin,
  requireGestionCategorias
};
