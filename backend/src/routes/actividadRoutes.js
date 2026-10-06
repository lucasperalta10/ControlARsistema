import { Router } from 'express';
import { getActividad } from '../controllers/actividadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Auditoría requiere SUPER_ADMIN
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/', getActividad);

export default router;
