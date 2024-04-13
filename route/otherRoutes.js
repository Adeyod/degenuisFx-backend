import express from 'express';
import {
  feedBack,
  emailSubscription,
  contactUs,
} from '../controller/otherControllers.js';

const router = express.Router();

router.get('/feedback', feedBack);
router.get('/contactUs', contactUs);
router.get('/emailSubscription', emailSubscription);

export default router;
