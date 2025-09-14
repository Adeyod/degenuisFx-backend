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
  updateStudent,
  getStudentsBySearch,
  subscribeToCourse,
} from '../controller/studentControllers.js';
import { verifyAccessToken } from '../middleware/jwtAuth.js';
import { permission } from '../utils/authorization.js';
import { memberRole } from '../utils/enumModules.js';
import { limiter } from '../utils/limiter.js';

const router = express.Router();

router.post('/updateStudent/:studentId', verifyAccessToken, updateStudent);

router.post('/register', registerStudent);
// router.post('/login', limiter(5), loginStudent);
router.post('/login', loginStudent);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:userId/:token', resetPassword);
router.post('/resendEmailVerification', resendEmailVerification);
router.post('/verify-email/:userId/:token', verifyStudentEmail);
router.get('/getStudent/:studentId', verifyAccessToken, getStudent);
router.get(
  '/getSingleStudent/:studentId',
  verifyAccessToken,
  permission(['admin']),
  getSingleStudent
);
router.get(
  '/getAllStudents',
  verifyAccessToken,
  permission(['admin']),
  getAllStudents
);
router.get('/getStudentsBySearch', getStudentsBySearch);
router.post('/subscribeToCourse', subscribeToCourse);
router.get('/logout', studentLogout);

export default router;
