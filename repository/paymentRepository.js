import Student from '../model/studentModel.js';
import Payment from '../model/paymentModel.js';
import {
  enrollmentStatus,
  paymentModeEnum,
  paymentStatus,
} from '../utils/enumModules.js';
import Enrollment from '../model/enrollmentModel.js';
import { paymentEnrollmentConfirmationMail } from '../utils/nodemailer.js';

const saveInitializedPayment = async (data) => {
  const {
    userId,
    training,
    // enrollment,
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
    reference,
    authorizationUrl,
  } = data;

  const findStudent = await Student.findById(userId);

  if (!findStudent) {
    return res.status(404).json({
      error: 'Student not found',
      success: false,
      status: 404,
    });
  }

  let enrollment;

  const enrollementExist = await Enrollment.findOne({
    studentId: findStudent._id,
    training: training._id,
  });

  if (enrollementExist) {
    (enrollementExist.preferedClassMode = preferedClassMode),
      (enrollementExist.paymentMode = paymentMode),
      (enrollementExist.enrollmentStatus = enrollmentStatus[1]),
      (enrollment = enrollementExist);
  } else {
    const newEnrollment = new Enrollment({
      studentId: findStudent._id,
      training: training,
      preferedClassMode: preferedClassMode,
      paymentMode: paymentMode,
      enrollmentStatus: enrollmentStatus[1],
    });
    await newEnrollment.save();
    enrollment = newEnrollment;
  }

  if (!enrollment) {
    return res.status(400).json({
      error: 'Unable to create enrollment',
      success: false,
      status: 400,
    });
  }

  const summary = {
    amountPaid: amountPaid,
    transactionType: transactionType,
    transactionStatus: transactionStatus,
    description: description,
    companyPaymentReference: companyPaymentReference,
    reference: reference,
    authorizationUrl: authorizationUrl,
  };

  let payment;

  const paymentDocExist = await Payment.findOne({
    userId: findStudent._id,
    training: training._id,
  });

  if (paymentDocExist) {
    paymentDocExist.paymentSummary.push(summary);
    paymentDocExist.balance = balance;
    paymentDocExist.dueDate =
      paymentMode === paymentModeEnum[1] ? nextPaymentDate : null;
    paymentDocExist.preferedClassMode = preferedClassMode;
    paymentDocExist.paymentMode = paymentMode;

    paymentDocExist.markModified('paymentStatus');
    await paymentDocExist.save();
    payment = paymentDocExist;
    console.log('payment inside existing payment doc:', payment);
  } else {
    const saveTransaction = new Payment({
      userId: findStudent._id,
      balance: balance,
      enrollment: enrollment._id,
      training: training,
      dueDate: paymentMode === paymentModeEnum[1] ? nextPaymentDate : null,
      trainingFee: trainingFee,
      paymentSummary: [summary],
      preferedClassMode: preferedClassMode,
      paymentMode: paymentMode,
    });

    const transactionResponse = await saveTransaction.save();
    payment = transactionResponse;
    console.log('payment for new payment doc:', payment);
  }

  console.log('payment:', payment);

  return payment;
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
    reference,
    authorizationUrl,
  } = data;

  const paymentDoc = await Payment.findById({ _id: paymentId });

  if (!paymentDoc) {
    throw new Error('Payment document not found.', 404);
  }

  const summary = {
    amountPaid: amountPaid,
    transactionType: transactionType,
    transactionStatus: transactionStatus,
    description: description,
    companyPaymentReference: companyPaymentReference,
    reference: reference,
    authorizationUrl: authorizationUrl,
  };

  // (paymentDoc.balance = balance),
  paymentDoc.paymentSummary.push(summary);
  paymentDoc.markModified('paymentSummary');
  const transactionResponse = await paymentDoc.save();

  return transactionResponse;
};

const findPaymentTransactionByReferenceAndUpdateStatus = async (data) => {
  try {
    const { reference, status, amount } = data;

    const transaction = await Payment.findOne({
      'paymentSummary.reference': reference,
    });

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

    const enrollment = await Enrollment.findById({
      _id: transaction.enrollment,
    });

    if (!enrollment) {
      throw new Error('Enrollment not found.', 404);
    }

    if (actualPayment.transactionStatus === 'pending') {
      console.log('I am running here');
      actualPayment.transactionStatus = status;

      const student = await Student.findById({
        _id: enrollment.studentId,
      });

      console.log('student:', student);

      if (!student) {
        return res.status(404).json({
          status: 404,
          success: false,
          error: 'Student not found.',
        });
      }

      const fullName = `${student.firstName} ${student.lastName}`;
      console.log('fullName:', fullName);

      if (status === 'success') {
        if (transaction.trainingFee > transaction.currentPayment) {
          transaction.currentPayment += Number(actualPayment.amountPaid);
        }

        const calBal =
          Number(transaction.trainingFee) - Number(actualPayment.amountPaid);
        if (
          Number(actualPayment.amountPaid) === Number(transaction.trainingFee)
        ) {
          console.log('I am running full payment');
          enrollment.enrollmentStatus = enrollmentStatus[3];
          transaction.paymentStatus = paymentStatus[2];

          await paymentEnrollmentConfirmationMail({
            email: student.email,
            enrollmentDate: Date.now(),
            amountPaid: actualPayment.amountPaid,
            courseType: enrollment.preferedClassMode,
            paymentstatus: paymentStatus[2],
            nextPaymentDate: '',
            fullName: fullName,
          });
        } else if (
          Number(actualPayment.amountPaid) < Number(transaction.trainingFee)
        ) {
          console.log('I am running part payment');
          if (transaction.currentPayment === transaction.trainingFee) {
            console.log('I am running part payment. the remaining balance');
            enrollment.enrollmentStatus = enrollmentStatus[3];
            transaction.paymentStatus = paymentStatus[2];
            transaction.balance = 0;
            transaction.dueDate = null;
          } else {
            console.log('I am running part payment. the initial payment');

            enrollment.enrollmentStatus = enrollmentStatus[2];
            transaction.paymentStatus = paymentStatus[1];
            await paymentEnrollmentConfirmationMail({
              email: student.email,
              enrollmentDate: Date.now(),
              amountPaid: actualPayment.amountPaid,
              courseType: enrollment.preferedClassMode,
              paymentstatus: paymentStatus[1],
              nextPaymentDate: actualPayment.dueDate,
              fullName: fullName,
            });
          }
        }
      }
      enrollment.markModified('enrollmentStatus');
      transaction.markModified('paymentSummary');

      await enrollment.save();
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

    console.log(
      'I am updating payment to store payment URL before sending to frontend'
    );

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

    const enrollment = await Enrollment.findById({
      _id: findPayment.enrollment,
    });

    if (!enrollment) {
      throw new Error('Enrollment document not found.', 404);
    }

    const updatedActualDoc = findPayment.paymentSummary.find(
      (p) => p.companyPaymentReference === companyPaymentReference
    );

    if (!updatedActualDoc) {
      throw new Error('Actual payment document object not found.', 404);
    }

    // if (findPayment.trainingFee > updatedActualDoc.amountPaid) {
    //   enrollment.enrollmentStatus = enrollmentStatus[2];
    // } else if (findPayment.trainingFee === updatedActualDoc.amountPaid) {
    //   enrollment.enrollmentStatus = enrollmentStatus[3];
    // } else {
    //   enrollment.enrollmentStatus = enrollmentStatus[1];
    // }

    updatedActualDoc.reference = reference;
    updatedActualDoc.authorizationUrl = authorizationUrl;

    findPayment.markModified('paymentSummary');
    enrollment.markModified('enrollmentStatus');
    await findPayment.save();
    await enrollment.save();

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
