import express from 'express';
import {
  getInvestor,
  registerInvestor,
  verifyInvestorEmail,
  loginInvestor,
} from '../controller/investorControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';

const router = express.Router();

router.post('/register', registerInvestor);
router.post('/login', loginInvestor);
router.post('/verify-email/:userId/:token', verifyInvestorEmail);
router.get('/getInvestor/:investorId', verifyToken, getInvestor);

export default router;
