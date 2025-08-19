import express from 'express';
import { makePayment } from '../controller/trainingPaymentController.js';
import { verifyAccessToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';

const router = express.Router();

router.post(
  '/make-payment',
  verifyAccessToken,
  permission(['student']),
  makePayment
);

export default router;
