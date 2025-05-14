import { Router } from 'express';
import { register, login, handlePasswordResetRequest } from '../controllers/auth.controller';
import { authLogger } from '../middlewares/auth-logger.middleware';

const router = Router();

// Add auth logger middleware to all auth routes
router.use(authLogger);

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password-request', handlePasswordResetRequest);

// TODO: Add route for handling the actual password reset link (e.g., POST /reset-password/:token)

export default router;
