import express from 'express';
import { UserController } from '../controllers/user.controller';
import { adminMiddleware } from '../middlewares/admin.middleware'; // Only admin can access these routes

const router = express.Router();

router.post('/', adminMiddleware, UserController.createUser);
router.get('/', adminMiddleware, UserController.getUsers);
router.patch('/:id/toggle', adminMiddleware, UserController.toggleUserActiveStatus);

export default router;
