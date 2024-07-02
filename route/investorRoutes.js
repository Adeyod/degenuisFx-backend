import express from 'express';
import {
  getInvestor,
  registerInvestor,
  verifyInvestorEmail,
  loginInvestor,
  getAllInvestors,
  getSingleInvestor,
  investorLogout,
  forgotPassword,
  resetPassword,
  resendEmailVerification,
  updateInvestor,
  getInvestorsBySearch,
  invest,
} from '../controller/investorControllers.js';
import { verifyToken } from '../utils/jwtAuth.js';
import { permission } from '../utils/authorization.js';
import { memberRole } from '../utils/enumModules.js';
import { limiter } from '../utils/limiter.js';

const router = express.Router();

router.post('/updateInvestor/:investorId', verifyToken, updateInvestor);

router.post('/register', registerInvestor);
router.post('/login', loginInvestor);
// router.post('/login', limiter(5), loginInvestor);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:userId/:token', resetPassword);
router.post('/resendEmailVerification', resendEmailVerification);
router.post('/verify-email/:userId/:token', verifyInvestorEmail);
router.get('/getInvestor/:investorId', verifyToken, getInvestor);
router.get(
  '/getSingleInvestor/:investorId',
  verifyToken,
  permission,
  getSingleInvestor
);
router.get('/getAllInvestors', verifyToken, permission, getAllInvestors);
router.get('/getInvestorsBySearch', getInvestorsBySearch);
router.post('/invest', invest);
router.get('/logout', investorLogout);

export default router;

/*
1, 4, 6, 7, 8, 9,

admin will be using same endpoint to login as student

logout done for student and investor

get single student done

get single investor done

get all investors done

get all students done

forgot password

reset password

roles added to the student and investor

only admin will have access to getAllInvestors, 
getAllStudents, getSingleStudent. 
getSingleInvestor

YET TO BE DONE
2,3,10,11

what are the informations to be saved during subscriptions of both student and investor

*/
