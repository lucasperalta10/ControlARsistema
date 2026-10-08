import { Router } from 'express';
import { getEstado, getConfiguracion, updateMargenPredeterminado } from '../controllers/sistemaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Requiere autenticación general
router.use(authMiddleware);

// Rutas de configuración comercial (accesibles por usuarios autenticados)
router.get('/configuracion', getConfiguracion);
router.put('/configuracion/margen-predeterminado', updateMargenPredeterminado);

// Consultar estado de infraestructura técnica requiere SUPER_ADMIN
router.get('/estado', requireSuperAdmin, getEstado);

export default router;

