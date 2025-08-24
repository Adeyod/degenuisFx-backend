import express from 'express';
import {
  makePayment,
  getPaymentTransactionResponseFromPaystackWebhook,
  getPaystackCallBack,
  balancePayment,
} from '../controller/paymentController.js';
import { verifyAccessToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';

const router = express.Router();

router.post('/web-hook', getPaymentTransactionResponseFromPaystackWebhook);
router.get('/call-back/:reference', getPaystackCallBack);

router.post(
  '/make-payment',
  verifyAccessToken,
  permission(['student']),
  makePayment
);

router.post(
  '/balance-payment/:paymentId',
  verifyAccessToken,
  permission(['student']),
  balancePayment
);

export default router;
