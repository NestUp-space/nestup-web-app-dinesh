import express from 'express';
import { bookSiteVisit } from '../controllers/siteVisit.controller';
import { validateRequest } from '../common/middleware/validateRequest';
import { createBookingSchema } from '../validations/siteVisitBooking.validation';

const router = express.Router();

router.post('/book', validateRequest(createBookingSchema), bookSiteVisit);

export default router;
