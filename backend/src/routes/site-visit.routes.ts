import express from 'express';
import { bookSiteVisit } from '../controllers/siteVisit.controller';
import { validateRequest } from '../common/middleware/validateRequest';
import { bookSiteVisitSchema } from '../validations/siteVisit.validation';

const router = express.Router();

router.post('/book', validateRequest(bookSiteVisitSchema), bookSiteVisit);

export default router;
