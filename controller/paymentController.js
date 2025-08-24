import Enrollment from '../model/enrollmentModel.js';
import Payment from '../model/paymentModel.js';
import Student from '../model/studentModel.js';
import Training from '../model/trainingModel.js';
import {
  getTrainingUsingPreferedClassMode,
  getTrainingUsingTrainingIdAndTrainingFee,
} from '../repository/trainingRepository.js';
import {
  enrollmentPaymentStatus,
  enrollmentStatus,
  paymentModeEnum,
  preferedClassModeEnum,
} from '../utils/enumModules.js';
import {
  calculateNextPaymentDay,
  generatePaymentReference,
} from '../utils/functions.js';
import {
  paystackCallBack,
  payStackInitialized,
  payStackPaymentBalanceInitialized,
  paystackWebHook,
} from '../utils/paystack.js';
import { paymentSchema } from '../utils/validation.js';
import dayjs from 'dayjs';

const makePayment = async (req, res) => {
  try {
    console.log('I am trying to run the controller.');
    const user = req.user;

    const {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
      balance,
      nextPaymentDate,
    } = req.body;

    const requiredFields = {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
    };

    const missingField = Object.entries(requiredFields).find(
      ([key, value]) => !value
    );

    if (missingField) {
      return res.json({
        error: `Please provide ${missingField[0].replace(
          '_',
          ' '
        )} to proceed.`,
        status: 400,
        success: false,
      });
    }

    const payload = {
      preferedClassMode,
      paymentMode,
      trainingFee,
      amountPaid,
      balance,
      nextPaymentDate,
    };

    const { error, value } = paymentSchema.validate(payload);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        success: false,
        status: 400,
      });
    }

    const backendNextPaymentDate = calculateNextPaymentDay();
    console.log('backendNextPaymentDate:', backendNextPaymentDate);

    if (!preferedClassModeEnum.includes(preferedClassMode)) {
      return res.status(400).json({
        error: 'Invalid class mode',
        success: false,
        status: 400,
      });
    }

    if (!paymentModeEnum.includes(paymentMode)) {
      return res.status(400).json({
        error: 'Invalid payment mode',
        success: false,
        status: 400,
      });
    }

    const userExist = await Student.findById(user.userId);

    if (!userExist) {
      return res.status(404).json({
        error: 'User not found',
        success: false,
        status: 404,
      });
    }

    // fetch training document here so as to get the training fee for the class mode

    const training = await getTrainingUsingPreferedClassMode(preferedClassMode);

    if (!training) {
      return res.status(404).json({
        message: 'Training does not exist',
        status: 404,
        success: false,
      });
    }

    console.log('training:', training);

    const actualTrainingFee = training.mode.fee;

    if (actualTrainingFee !== Number(trainingFee)) {
      return res.status(400).json({
        message: 'Invalid training fee',
        status: 400,
        success: false,
      });
    }

    let acurrateBalance = 0;
    let accurateNextPaymentDate = null;

    if (paymentMode === paymentModeEnum[1]) {
      if (!nextPaymentDate) {
        return res.status(400).json({
          error: `Next payment date is required.`,
          status: 400,
          success: false,
        });
      }

      const frontendDate = new Date(value.nextPaymentDate);

      console.log('frontendDate:', frontendDate);
      const frontendDateStr = dayjs(frontendDate).format('YYYY-MM-DD');

      console.log('frontendDateStr:', frontendDateStr);

      if (backendNextPaymentDate !== frontendDateStr) {
        return res.status(400).json({
          error: `Invalid nextPaymentDate. Expected ${backendNextPaymentDate}, got ${frontendDateStr}.`,
          success: false,
          status: 400,
        });
      } else {
        accurateNextPaymentDate = backendNextPaymentDate;
      }

      const minimumPayment = actualTrainingFee / 2;
      console.log('minimumPayment:', minimumPayment);
      if (amountPaid < minimumPayment) {
        return res.status(400).json({
          message: `The minimum amount allowed to be paid for this class is ${minimumPayment}`,
          status: 400,
          success: false,
        });
      }

      acurrateBalance = actualTrainingFee - amountPaid;
      if (balance < acurrateBalance) {
        return res.status(400).json({
          message: `The balance expected is not accurate. The balance you are to pay on or before ${backendNextPaymentDate} is $${acurrateBalance}, please ensure you are ok with this before proceeding.`,
          status: 400,
          success: false,
        });
      }

      console.log('acurrateBalance:', acurrateBalance);
    } else if (paymentMode === paymentModeEnum[0]) {
      if (amountPaid < actualTrainingFee) {
        return res.status(400).json({
          message: `The actual training fee is $${actualTrainingFee} and this is the amount you are supposed to pay.`,
          status: 400,
          success: false,
        });
      }

      acurrateBalance = balance;
    }

    let newEnrollment = new Enrollment({
      studentId: userExist._id,
      training: training._id,
      preferedClassMode: training.mode.title,
      paymentMode: paymentMode,
      status: enrollmentStatus[0],
    });

    newEnrollment = await newEnrollment.save();

    if (!newEnrollment) {
      return res.status(400).json({
        error: 'Unable to create enrollment',
        success: false,
        status: 400,
      });
    }

    const paymentReferencePayload = {
      trainingId: training._id,
      userId: userExist._id,
      paymentMode: paymentMode,
    };

    const reference = generatePaymentReference(paymentReferencePayload);

    console.log('reference:', reference);

    const userPayload = {
      preferedClassMode: value.preferedClassMode,
      training: training._id,
      paymentMode: value.paymentMode,
      enrollment: newEnrollment._id,
      trainingFee: actualTrainingFee,
      // trainingFee: value.trainingFee,
      amountPaid: value.amountPaid,
      balance: acurrateBalance,
      companyPaymentReference: reference,
      nextPaymentDate:
        paymentMode === paymentModeEnum[1] && accurateNextPaymentDate,
      // nextPaymentDate:
      //   paymentMode === paymentModeEnum[1] && value.nextPaymentDate,
      email: userExist.email,
      userId: userExist._id,
    };

    console.log('userPayload:', userPayload);

    const result = await payStackInitialized(userPayload);

    if (!result) {
      return res.status(400).json({
        message: 'Unable to process payment.',
        success: false,
        status: 400,
      });
    }

    return res.json({
      message: 'Initialized payment successfully',
      data: result.response.data.data,
      success: true,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const getPaymentTransactionResponseFromPaystackWebhook = async (req, res) => {
  try {
    const paystackResponse = await paystackWebHook(req, res);

    console.log('paystackResponse:', paystackResponse);

    return res.status(200).json({
      message: 'Payment webhook processed successfully',
      success: true,
      status: 200,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const getPaystackCallBack = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await paystackCallBack(reference);

    if (!response) {
      return res.status(400).json({
        message: 'Unable to process callback.',
        status: 400,
        success: false,
      });
    }
    return res.status(200).json({
      message: 'Callback processed successfully',
      data: response,
      success: true,
      status: 200,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const balancePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amountToPay } = req.body;
    const user = req.user;

    if (!amountToPay) {
      return res.json({
        error: `Amount to pay is required.`,
        status: 400,
        success: false,
      });
    }

    const studentPaymentDoc = await Payment.findById({ _id: paymentId });

    if (!studentPaymentDoc) {
      return res.json({
        error: `Payment Document not found.`,
        status: 400,
        success: false,
      });
    }

    if (amountToPay > studentPaymentDoc.balance) {
      return res.json({
        error: `Please put the accurate balance. Your balance is ${studentPaymentDoc.balance}.`,
        status: 400,
        success: false,
      });
    }

    if (amountToPay < studentPaymentDoc.balance) {
      return res.json({
        error: `Please put the accurate balance. Your balance is ${studentPaymentDoc.balance}.`,
        status: 400,
        success: false,
      });
    }

    const trainingDoc = await getTrainingUsingTrainingIdAndTrainingFee(
      studentPaymentDoc.training,
      studentPaymentDoc.trainingFee
    );

    if (!trainingDoc) {
      return res.status(404).json({
        message: 'Training does not exist',
        status: 404,
        success: false,
      });
    }

    const paymentReferencePayload = {
      trainingId: trainingDoc._id,
      userId: userExist._id,
      paymentMode: 'balance',
    };

    const reference = generatePaymentReference(paymentReferencePayload);

    console.log('reference:', reference);

    const userPayload = {
      userId: user.userId,
      amountPaid: amountToPay,
      paymentId: studentPaymentDoc._id,
      companyPaymentReference: reference,
      balance: (studentPaymentDoc.balance -= amountToPay),
      email: user.userEmail,
    };

    console.log('userPayload:', userPayload);

    const result = await payStackPaymentBalanceInitialized(userPayload);

    if (!result) {
      return res.status(400).json({
        message: 'Unable to process payment.',
        success: false,
        status: 400,
      });
    }

    return res.status(200).json({
      message: 'Initialized payment successfully',
      data: result.response.data.data,
      success: true,
      status: 200,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

export {
  makePayment,
  getPaymentTransactionResponseFromPaystackWebhook,
  getPaystackCallBack,
  balancePayment,
};
