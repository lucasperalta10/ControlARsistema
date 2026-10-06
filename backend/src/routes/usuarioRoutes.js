import { Router } from 'express';
import {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  resetearPin
} from '../controllers/usuarioController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Todas las rutas de usuarios requieren SUPER_ADMIN (sección 30 y 33)
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.patch('/:id/estado', cambiarEstadoUsuario);
router.post('/:id/reset-pin', resetearPin);

export default router;
