import Student from '../model/studentModel.js';
import TrainingPayment from '../model/trainingPaymentModel.js';
import { paymentModeEnum } from '../utils/enumModules.js';

const saveInitializedPayment = async (data) => {
  const {
    status,
    message,
    reference,
    userId,
    nextPaymentDate,
    amountPaid,
    balance,
    transactionType,
    transactionStatus,
    preferedClassMode,
    description,
    paymentMode,
    trainingFee,
    authorizationUrl,
  } = data;

  const findStudent = await Student.findById(userId);

  const summary = {
    amountPaid: amountPaid,
    balance: balance,
    transactionType: transactionType,
    transactionStatus: transactionStatus,
    description: description,
    reference: reference,
    authorizationUrl: authorizationUrl,
  };

  const saveTransaction = new TrainingPayment({
    userId: findStudent._id,
    nextPaymentDate:
      paymentMode === paymentModeEnum[1] ? nextPaymentDate : null,
    preferedClassMode: preferedClassMode,
    paymentMode: paymentMode,
    trainingFee: trainingFee,
    paymentSummary: [summary],
  });

  const transactionResponse = await saveTransaction.save();

  return transactionResponse;
};

export { saveInitializedPayment };
