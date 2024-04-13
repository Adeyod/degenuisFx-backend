import express from 'express';
import {
  registerStudent,
  verifyStudentEmail,
  loginStudent,
  getStudent,
} from '../controller/studentControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/verify-email/:userId/:token', verifyStudentEmail);
router.get('/getStudent/:studentId', verifyToken, getStudent);

export default router;
