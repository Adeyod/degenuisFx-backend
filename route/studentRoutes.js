import express from 'express';
import {
  registerStudent,
  verifyStudentEmail,
  loginStudent,
  getStudent,
  getSingleStudent,
  getAllStudents,
  studentLogout,
  forgotPassword,
  resetPassword,
  resendEmailVerification,
} from '../controller/studentControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';
import { memberRole } from '../utils/enumModules.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:userId/:token', resetPassword);
router.post('/resendEmailVerification', resendEmailVerification);
router.post('/verify-email/:userId/:token', verifyStudentEmail);
router.get('/getStudent/:studentId', verifyToken, getStudent);
router.get(
  '/getSingleStudent/:studentId',
  verifyToken,
  permission,
  getSingleStudent
);
router.get('/getAllStudents', verifyToken, permission, getAllStudents);
router.get('/logout', studentLogout);

export default router;
