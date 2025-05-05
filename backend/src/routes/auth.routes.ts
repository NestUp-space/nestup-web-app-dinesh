import { Router } from 'express';
// Import the renamed controller function
import { register, login, handlePasswordResetRequest } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Use the renamed controller function for the route
router.post('/reset-password-request', handlePasswordResetRequest); // Renamed route for clarity

// TODO: Add route for handling the actual password reset link (e.g., POST /reset-password/:token)

export default router;
