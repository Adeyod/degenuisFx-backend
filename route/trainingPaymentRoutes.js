import express from 'express';
import {
  makePayment,
  getPaymentTransactionResponseFromPaystackWebhook,
  getPaystackCallBack,
} from '../controller/trainingPaymentController.js';
import { verifyAccessToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';

const router = express.Router();

router.post('/web-hook', getPaymentTransactionResponseFromPaystackWebhook);
router.get('/call-back', getPaystackCallBack);

router.post(
  '/make-payment',
  verifyAccessToken,
  permission(['student']),
  makePayment
);

export default router;
