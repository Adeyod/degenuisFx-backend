import express from 'express';
import {
  feedBack,
  emailSubscription,
  contactUs,
} from '../controller/otherControllers.js';

const router = express.Router();

router.post('/feedback', feedBack);
router.post('/contactUs', contactUs);
router.post('/emailSubscription', emailSubscription);

export default router;
