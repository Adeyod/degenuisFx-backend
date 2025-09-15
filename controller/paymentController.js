import Enrollment from '../model/enrollmentModel.js';
import Payment from '../model/paymentModel.js';
import Student from '../model/studentModel.js';
import Training from '../model/trainingModel.js';
import {
  getTrainingUsingPreferedClassMode,
  getTrainingUsingTrainingIdAndTrainingFee,
} from '../repository/trainingRepository.js';
import { AppError } from '../utils/app.error.js';
import {
  paymentStatus,
  enrollmentStatus,
  paymentModeEnum,
  preferedClassModeEnum,
} from '../utils/enumModules.js';
import {
  calculateNextPaymentDay,
  generatePaymentReference,
  getStudentLocation,
  getUsdToNgnRate,
} from '../utils/functions.js';
import {
  paystackCallBack,
  payStackInitialized,
  payStackPaymentBalanceInitialized,
  paystackWebHook,
  paystackAuthUrlValidity,
} from '../utils/paystack.js';
import catchErrors from '../utils/tryCatch.js';
import { paymentSchema } from '../utils/validation.js';
import dayjs from 'dayjs';

const makePayment = catchErrors(async (req, res) => {
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
    throw new AppError(
      `Please provide ${missingField[0].replace('_', ' ')} to proceed.`,
      400
    );
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
    throw new AppError(error.details[0].message, 400);
  }

  const backendNextPaymentDate = calculateNextPaymentDay();

  if (!preferedClassModeEnum.includes(preferedClassMode)) {
    throw new AppError('Invalid class mode', 400);
  }

  if (!paymentModeEnum.includes(paymentMode)) {
    throw new AppError('Invalid payment mode', 400);
  }

  const userExist = await Student.findById(user.userId);

  if (!userExist) {
    throw new AppError('User not found', 404);
  }

  // fetch training document here so as to get the training fee for the class mode

  const training = await getTrainingUsingPreferedClassMode(preferedClassMode);

  if (!training) {
    throw new AppError('Training does not exist', 404);
  }

  const paymentDocExist = await Payment.findOne({
    userId: userExist._id,
    training: training._id,
    // 'paymentSummary.transactionStatus': 'success',
  });

  if (paymentDocExist) {
    throw new AppError('Student already enrolled for this training.', 400);
  }

  const actualTrainingFee = training.mode.fee;

  if (actualTrainingFee !== Number(trainingFee)) {
    throw new AppError('Invalid training fee', 400);
  }

  let acurrateBalance = 0;
  let accurateNextPaymentDate = null;

  if (paymentMode === paymentModeEnum[1]) {
    if (!nextPaymentDate) {
      throw new AppError(`Next payment date is required.`, 400);
    }

    const frontendDate = new Date(value.nextPaymentDate);

    const frontendDateStr = dayjs(frontendDate).format('YYYY-MM-DD');

    if (backendNextPaymentDate !== frontendDateStr) {
      throw new AppError(
        `Invalid nextPaymentDate. Expected ${backendNextPaymentDate}, got ${frontendDateStr}.`,
        400
      );
    } else {
      accurateNextPaymentDate = backendNextPaymentDate;
    }

    const minimumPayment = actualTrainingFee / 2;

    if (amountPaid < minimumPayment) {
      throw new AppError(
        `The minimum amount allowed to be paid for this class is ${minimumPayment}`,
        400
      );
    }

    acurrateBalance = actualTrainingFee - amountPaid;
    if (balance < acurrateBalance) {
      throw new AppError(
        `The balance expected is not accurate. The balance you are to pay on or before ${backendNextPaymentDate} is $${acurrateBalance}, please ensure you are ok with this before proceeding.`,
        400
      );
    }
  } else if (paymentMode === paymentModeEnum[0]) {
    if (amountPaid < actualTrainingFee) {
      throw new AppError(
        `The actual training fee is $${actualTrainingFee} and this is the amount you are supposed to pay.`,
        400
      );
    }

    acurrateBalance = balance;
  }

  const paymentReferencePayload = {
    trainingId: training._id,
    userId: userExist._id,
    paymentMode: paymentMode,
  };

  const reference = generatePaymentReference(paymentReferencePayload);

  let exchangeRate;
  if (userExist.geoLocation.toLowerCase().trim() === 'nigeria') {
    exchangeRate = 1500;
  } else {
    const actualRate = getUsdToNgnRate();
    exchangeRate = actualRate;
  }

  const nairaValue = value.amountPaid * exchangeRate;

  const userPayload = {
    preferedClassMode: value.preferedClassMode,
    training: training._id,
    paymentMode: value.paymentMode,
    // enrollment: newEnrollment._id,
    trainingFee: actualTrainingFee,
    // trainingFee: value.trainingFee,
    amountPaid: value.amountPaid,
    nairaValue: nairaValue,
    balance: acurrateBalance,
    companyPaymentReference: reference,
    nextPaymentDate:
      paymentMode === paymentModeEnum[1] && accurateNextPaymentDate,
    // nextPaymentDate:
    //   paymentMode === paymentModeEnum[1] && value.nextPaymentDate,
    email: userExist.email,
    userId: userExist._id,
  };

  const result = await payStackInitialized(userPayload);

  if (!result) {
    throw new AppError('Unable to process payment.', 400);
  }

  return res.status(200).json({
    message: 'Initialized payment successfully',
    data: result.response.data.data,
    success: true,
  });
});

const getPaymentTransactionResponseFromPaystackWebhook = catchErrors(
  async (req, res) => {
    const paystackResponse = await paystackWebHook(req, res);

    return res.status(200).json({
      message: 'Payment webhook processed successfully',
      success: true,
      status: 200,
    });
  }
);

const getPaystackCallBack = catchErrors(async (req, res) => {
  const { reference } = req.params;

  const response = await paystackCallBack(reference);

  if (!response) {
    throw new AppError('Unable to process callback.', 400);
  }
  return res.status(200).json({
    message: 'Callback processed successfully',
    data: response,
    success: true,
    status: 200,
  });
});

const balancePayment = catchErrors(async (req, res) => {
  const { paymentId } = req.params;
  const { amountToPay } = req.body;
  const user = req.user;

  if (!amountToPay) {
    throw new AppError(`Amount to pay is required.`, 400);
  }

  const userExist = await Student.findById({ _id: user.userId });

  if (!userExist) {
    throw new AppError(`Student not found.`, 404);
  }
  const studentPaymentDoc = await Payment.findById({ _id: paymentId });

  if (!studentPaymentDoc) {
    throw new AppError(`Payment Document not found.`, 404);
  }

  if (studentPaymentDoc.paymentSummary.length === 2) {
    throw new AppError(`Payment Summary already has 2 instances.`, 400);
  }

  if (amountToPay > studentPaymentDoc.balance) {
    throw new AppError(
      `Please put the accurate balance. Your balance is ${studentPaymentDoc.balance}.`,
      400
    );
  }

  if (amountToPay < studentPaymentDoc.balance) {
    throw new AppError(
      `Please put the accurate balance. Your balance is ${studentPaymentDoc.balance}.`,
      400
    );
  }

  const trainingDoc = await getTrainingUsingTrainingIdAndTrainingFee(
    studentPaymentDoc.training,
    studentPaymentDoc.trainingFee
  );

  if (!trainingDoc) {
    throw new AppError('Training does not exist', 404);
  }

  const paymentReferencePayload = {
    trainingId: trainingDoc._id,
    userId: user.userId,
    paymentMode: 'balance',
  };

  const reference = generatePaymentReference(paymentReferencePayload);

  let exchangeRate;
  if (userExist.geoLocation.toLowerCase().trim() === 'nigeria') {
    exchangeRate = 1500;
  } else {
    const actualRate = getUsdToNgnRate();
    exchangeRate = actualRate;
  }

  const nairaValue = value.amountPaid * exchangeRate;

  const userPayload = {
    userId: user.userId,
    amountPaid: amountToPay,
    nairaValue: nairaValue,
    paymentId: studentPaymentDoc._id,
    companyPaymentReference: reference,
    balance: (studentPaymentDoc.balance -= amountToPay),
    email: user.userEmail,
  };

  const result = await payStackPaymentBalanceInitialized(userPayload);

  if (!result) {
    throw new AppError('Unable to process payment.', 400);
  }

  return res.status(200).json({
    message: 'Initialized balance payment successfully',
    data: result.response.data.data,
    success: true,
    status: 200,
  });
});

const resetPaymentDoc = catchErrors(async (req, res) => {
  const user = req.user;

  const studentPaymentDoc = await Payment.findOneAndDelete({
    userId: user.userId,
  });

  if (!studentPaymentDoc) {
    throw new AppError(`Payment Document not found.`, 400);
  }

  const studentEnrollmentDoc = await Enrollment.findOneAndDelete({
    studentId: user.userId,
  });

  if (!studentEnrollmentDoc) {
    throw new AppError(`Enrollment Document not found.`, 400);
  }

  return res.status(200).json({
    message: 'Payment document deleted successfully',
    success: true,
    status: 200,
  });
});

const confirmPaystackAuthUrlValidity = catchErrors(async (req, res) => {
  const { reference } = req.params;

  const response = await paystackAuthUrlValidity(reference);

  const user = await Student.findOne({
    _id: Object(response.userId),
    email: response.email,
  });

  const enrollment = await Enrollment.findOne({
    studentId: user._id,
  });

  const paymentDoc = await Payment.findOne({
    userId: user._id,
    'paymentSummary.reference': response.reference,
  });

  console.log('paymentDoc:', paymentDoc);

  if (response.message === 'Authorization URL has expired.') {
    console.log('response.message:', response.message);
    if (
      paymentDoc.paymentSummary.length > 1 &&
      paymentDoc.paymentStatus === 'partially-paid'
    ) {
      console.log(
        'paymentDoc.paymentSummary.length > 1:',
        paymentDoc.paymentSummary.length > 1
      );
      console.log('paymentDoc.paymentStatus:', paymentDoc.paymentStatus);
      // const actualPaymentSummary = paymentDoc.paymentSummary.filter(
      //   (a) => a.reference !== response.reference
      // );

      // paymentDoc.paymentSummary = actualPaymentSummary;
      // await paymentDoc.save();

      const actualPaymentSummary = await Payment.findOneAndUpdate(
        {
          userId: user._id,
          'paymentSummary.reference': response.reference,
        },
        {
          $pull: { paymentSummary: { reference: response.reference } },
        },
        { new: true }
      );
      console.log('actualPaymentSummary:', actualPaymentSummary);
      throw new AppError('authorization url expired.', 400);
    } else {
      await paymentDoc.deleteOne();
      await enrollment.deleteOne();
      throw new AppError('authorization url expired.', 400);
    }
  } else if (response.message === 'Authorization URL still valid.') {
    // console.log('response.message for valid URL:', response.message);
    const paymentTransactionDetails = paymentDoc.paymentSummary.find(
      (a) => a.reference === response.reference
    );
    // console.log('paymentTransactionDetails:', paymentTransactionDetails);
    return res.status(200).json({
      message: 'Authorization URL validation successfully',
      authorizationUrl: paymentTransactionDetails.authorizationUrl,
      success: true,
      status: 200,
    });
  }
});

export {
  makePayment,
  getPaymentTransactionResponseFromPaystackWebhook,
  getPaystackCallBack,
  balancePayment,
  confirmPaystackAuthUrlValidity,
  resetPaymentDoc,
};
