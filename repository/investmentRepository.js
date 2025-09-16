import Investment from '../model/investmentModel.js';
import InvestmentPayment from '../model/investmentPaymentModel.js';
import Investor from '../model/investorModel.js';

const findInvestmentTransactionByReferenceAndUpdateStatus = async (data) => {
  console.log('I am running a');

  try {
    const { reference, status, amount } = data;
    console.log('reference:', reference);

    const transaction = await InvestmentPayment.findOne({
      reference: reference,
    });

    console.log('transaction:', transaction);

    if (!transaction) {
      throw new AppError(
        `Payment transaction with reference NO: ${reference} is not found`,
        404
      );
    }

    const investor = await Investor.findById({
      _id: transaction.investor,
    });

    if (!investor) {
      throw new AppError(`Investor not found`, 404);
    }

    if (transaction.transactionStatus === 'pending') {
      console.log('I am running here');

      if (status === 'success') {
        transaction.transactionStatus = status;
        investor.isAdminChargesPaid = true;
      }
      transaction.markModified('paymentSummary');

      await transaction.save();
      await investor.save();
    } else {
      console.log('transaction already recorded...');
    }

    console.log('I am running c');

    return transaction;
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.message, error.statusCode);
    } else {
      console.log(error);
      throw new Error('Something happened.');
    }
  }
};

const saveInitializedInvestmentPayment = async (data) => {
  const {
    userId,
    investmentId,
    amountPaid,
    nairaValue,
    companyPaymentReference,
    investmentTransactionType,
    transactionStatus,
    description,
    status,
    message,
    reference,
    authorizationUrl,
  } = data;

  const findInvestor = await Investor.findById(userId);

  if (!findInvestor) {
    throw new AppError('Investor not found', 404);
  }

  const investmentDocExist = await Investment.findById({
    _id: investmentId,
  });

  if (!investmentDocExist) {
    throw new AppError('Investment document not found', 404);
  }

  if (investmentDocExist.isApprovedForInvestment !== true) {
    throw new AppError(
      'Investment not yet approved by admin for payment.',
      404
    );
  }

  const newInvestmentPaymentDoc = new InvestmentPayment({
    investment: investmentDocExist._id,
    investor: investmentDocExist.investor,
    paymentDate: Date.now(),
    amountPaid: amountPaid,
    nairaValue: nairaValue,
    investmentTransactionType: investmentTransactionType,
    transactionStatus: transactionStatus,
    description: description,
    reference: reference,
    companyPaymentReference: companyPaymentReference,
    authorizationUrl: authorizationUrl,
  });

  console.log('data:', data);

  await newInvestmentPaymentDoc.save();
  return newInvestmentPaymentDoc;
};

export {
  saveInitializedInvestmentPayment,
  findInvestmentTransactionByReferenceAndUpdateStatus,
};
