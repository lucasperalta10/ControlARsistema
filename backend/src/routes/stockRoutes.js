import { Router } from 'express';
import {
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
  getProductosReponer,
  getTodosLosMovimientos
} from '../controllers/stockController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Rutas de stock según sección 30
router.post('/:productoId/entrada', registrarEntrada);
router.post('/:productoId/salida', registrarSalida);
router.post('/:productoId/ajuste', registrarAjuste);
router.get('/reponer', getProductosReponer);
router.get('/movimientos', getTodosLosMovimientos);

export default router;
