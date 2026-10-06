import { Router } from 'express';
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria
} from '../controllers/categoriaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireGestionCategorias } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Ver categorías está permitido para cualquier usuario autenticado
router.get('/', getCategorias);

// Crear, editar y desactivar categorías requiere SUPER_ADMIN o permiso específico
router.post('/', requireGestionCategorias, crearCategoria);
router.put('/:id', requireGestionCategorias, actualizarCategoria);
router.delete('/:id', requireGestionCategorias, desactivarCategoria);

export default router;
