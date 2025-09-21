import express from 'express';
import {
  makePayment,
  getPaymentTransactionResponseFromPaystackWebhook,
  getPaystackCallBack,
  balancePayment,
  resetPaymentDoc,
  confirmPaystackAuthUrlValidity,
} from '../controller/paymentController.js';
import { verifyAccessToken } from '../middleware/jwtAuth.js';
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
router.get(
  '/paystack-auth-confirm/:reference',
  verifyAccessToken,
  permission(['student']),
  confirmPaystackAuthUrlValidity
);

router.put(
  '/reset-payment',
  verifyAccessToken,
  permission(['student']),
  resetPaymentDoc
);

router.post(
  '/balance-payment/:paymentId',
  verifyAccessToken,
  permission(['student']),
  balancePayment
);

export default router;
