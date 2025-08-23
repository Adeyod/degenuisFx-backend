import Student from '../model/studentModel.js';
import Payment from '../model/paymentModel.js';
import { enrollmentStatus, paymentModeEnum } from '../utils/enumModules.js';
import Enrollment from '../model/enrollmentModel.js';

const saveInitializedPayment = async (data) => {
  const {
    userId,
    training,
    enrollment,
    amountPaid,
    companyPaymentReference,
    transactionType,
    transactionStatus,
    description,
    preferedClassMode,
    paymentMode,
    trainingFee,
    balance,
    nextPaymentDate,
    email,
  } = data;

  const findStudent = await Student.findById(userId);

  const summary = {
    amountPaid: amountPaid,
    balance: balance,
    transactionType: transactionType,
    transactionStatus: transactionStatus,
    description: description,
    companyPaymentReference: companyPaymentReference,
  };

  const saveTransaction = new Payment({
    userId: findStudent._id,
    enrollment: enrollment,
    training: training,
    dueDate: paymentMode === paymentModeEnum[1] ? nextPaymentDate : null,
    trainingFee: trainingFee,
    paymentSummary: [summary],
    preferedClassMode: preferedClassMode,
    paymentMode: paymentMode,
  });

  const transactionResponse = await saveTransaction.save();

  return transactionResponse;
};

const saveInitializedBalance = async (data) => {
  const {
    userId,
    amountPaid,
    paymentId,
    companyPaymentReference,
    balance,
    email,
    transactionType,
    transactionStatus,
    description,
  } = data;

  const paymentDoc = await Payment.findById({ _id: paymentId });

  if (!paymentDoc) {
    throw new Error('Payment document not found.', 404);
  }

  const summary = {
    amountPaid: amountPaid,
    balance: balance,
    transactionType: transactionType,
    transactionStatus: transactionStatus,
    description: description,
    companyPaymentReference: companyPaymentReference,
  };

  paymentDoc.paymentSummary.push(summary);
  paymentDoc.markModified('paymentSummary');
  const transactionResponse = await paymentDoc.save();

  return transactionResponse;
};

const findPaymentTransactionByReferenceAndUpdateStatus = async (
  reference,
  status
) => {
  try {
    console.log('reference:', reference);
    console.log('status:', status);
    const transaction = await Payment.findOne({
      'paymentSummary.reference': reference,
    });

    console.log('transaction:', transaction);

    if (!transaction) {
      throw new Error(
        `Payment transaction with reference NO: ${reference} is not found`,
        404
      );
    }

    const actualPayment = transaction.paymentSummary.find(
      (a) => a.reference === reference
    );

    if (!actualPayment) {
      throw new Error(
        `Actual Payment transaction with reference NO: ${reference} is not found`,
        404
      );
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      { _id: transaction.enrollment },
      { status: enrollmentStatus[1] }
    );

    if (!enrollment) {
      throw new Error('Enrollment not found.', 404);
    }

    if (actualPayment.transactionStatus === 'pending') {
      actualPayment.transactionStatus = status;
      transaction.markModified('paymentSummary');
      await transaction.save();
    }

    return transaction;
  } catch (error) {
    throw new Error(error);
  }
};

const updatePaymentInitializationWithPaystackData = async (payload) => {
  try {
    const {
      companyPaymentReference,
      status,
      message,
      reference,
      authorizationUrl,
      paymentId,
    } = payload;

    if (
      !companyPaymentReference ||
      !status ||
      !message ||
      !reference ||
      !authorizationUrl ||
      !paymentId
    ) {
      throw new Error(
        'Please provide all needed data to process paystack initialization return.',
        400
      );
    }

    const findPayment = await Payment.findById(paymentId);

    if (!findPayment) {
      throw new Error('Payment document not found.', 404);
    }

    const updatedActualDoc = findPayment.paymentSummary.find(
      (p) => p.companyPaymentReference === companyPaymentReference
    );

    // console.log('updatedActualDoc:', updatedActualDoc);

    if (!updatedActualDoc) {
      throw new Error('Actual payment document object not found.', 404);
    }

    updatedActualDoc.reference = reference;
    updatedActualDoc.authorizationUrl = authorizationUrl;

    findPayment.markModified('paymentSummary');
    await findPayment.save();

    return findPayment;
  } catch (error) {
    console.log('error:', error);
    throw new Error(
      'Unable to update payment with paystack initialization details.',
      500
    );
  }
};

export {
  saveInitializedBalance,
  saveInitializedPayment,
  findPaymentTransactionByReferenceAndUpdateStatus,
  updatePaymentInitializationWithPaystackData,
};
