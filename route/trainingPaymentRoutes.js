import express from 'express';
import { makePayment } from '../controller/trainingPaymentController.js';
import { verifyToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';

const router = express.Router();

router.post('/make-payment', verifyToken, permission(['student']), makePayment);

export default router;
