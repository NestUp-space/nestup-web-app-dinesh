import express from 'express';
import { bookSiteVisit } from '@/controllers/siteVisit.controller';

const router = express.Router();

router.post('/book', bookSiteVisit);

export default router;