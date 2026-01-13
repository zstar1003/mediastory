import { Router } from 'express';
import { register, login, getCurrentUser, updateProfile } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 需要认证的路由
router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, updateProfile);

export default router;
