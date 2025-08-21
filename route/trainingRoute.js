import express from 'express';
import {
  createTraining,
  getTrainingDoc,
  updateTrainingFees,
} from '../controller/trainingController.js';
import { verifyAccessToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';

const router = express.Router();

router.post(
  '/create',
  verifyAccessToken,
  permission(['admin']),
  createTraining
);

router.put(
  '/update-training-fees',
  verifyAccessToken,
  permission(['admin']),
  updateTrainingFees
);

router.get(
  '/get-training',
  verifyAccessToken,
  // permission(['admin']),
  getTrainingDoc
);

export default router;
