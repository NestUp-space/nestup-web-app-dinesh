import express from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

const router = express.Router();
const validationController = new ValidationController();

// POST /api/v1/catalogue/validate-item-logic
router.post('/validate-item-logic',
    isAuthenticated,
    (req, res, next) => validationController.validateItemLogic(req, res, next)
);

export default router;
