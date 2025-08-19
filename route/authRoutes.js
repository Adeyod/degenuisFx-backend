import express from 'express';
import { requestAccessToken } from '../controller/authController.js';

const router = express.Router();

router.post('/request-access-token', requestAccessToken);

export default router;
