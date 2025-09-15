import express from 'express';

import { verifyAccessToken } from '../middleware/jwtAuth.js';
import { permission } from '../utils/authorization.js';
import {
  approveInvestmentToReceiveAdminCharges,
  getAllInvestments,
  getAllInvestmentsNotYetApproved,
  getASingleInvestment,
  getmySingleInvestment,
  investmentInterest,
} from '../controller/investmentController.js';

const router = express.Router();

router.use(verifyAccessToken);

router.post(
  '/investment-interest',
  permission(['investor']),
  investmentInterest
);
router.get('/get-all-investments', permission(['admin']), getAllInvestments);

router.get(
  '/get-all-not-approved-investments',
  permission(['admin']),
  getAllInvestmentsNotYetApproved
);

router.get(
  '/get-a-single-investment/:investmentId',
  permission(['admin']),
  getASingleInvestment
);

router.put(
  '/approve-investment-to-receive-admin-charges/:investmentId',
  permission(['admin']),
  approveInvestmentToReceiveAdminCharges
);

router.get(
  '/get-my-investment-by-id/:investmentId',
  permission(['investor']),
  getmySingleInvestment
);

export default router;
