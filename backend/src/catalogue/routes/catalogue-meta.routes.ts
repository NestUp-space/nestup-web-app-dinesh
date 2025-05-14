import express from 'express';
import { CatalogueMetaController } from '../controllers/catalogue-meta.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

const router = express.Router();
const catalogueMetaController = new CatalogueMetaController();

// Get global constants
// GET /api/v1/catalogue/global-constants
router.get('/global-constants',
    isAuthenticated,
    (req, res, next) => catalogueMetaController.getGlobalConstants(req, res, next)
);

export default router;
