import { Router } from 'express';
import { getEstado } from '../controllers/sistemaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Consultar estado del sistema requiere SUPER_ADMIN
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/estado', getEstado);

export default router;
