import { Router } from 'express';
import { login, logout, me, cambiarPin } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.put('/pin', authMiddleware, cambiarPin);

export default router;
