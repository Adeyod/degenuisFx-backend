import Investment from '../model/investmentModel.js';
import InvestmentPayment from '../model/investmentPaymentModel.js';
import Investor from '../model/investorModel.js';
import { AppError } from '../utils/app.error.js';
import {
  allowedInvestmentDurationEnum,
  feeTypeEnum,
  investmentTransactionTypeEnum,
} from '../utils/enumModules.js';
import {
  generatePaymentReference,
  getUsdToNgnRate,
} from '../utils/functions.js';
import {
  paystackAuthUrlValidity,
  payStackInitialized,
  payStackInvestmentPaymentInitialized,
} from '../utils/paystack.js';
import catchErrors from '../utils/tryCatch.js';
import { createInvestmentSchema } from '../utils/validation.js';

const investmentInterest = catchErrors(async (req, res) => {
  const {
    amountToInvest,
    investmentDuration,
    adminChargeFee,
    adminChargePercent,
  } = req.body;

  const user = req.user.userId;

  const investorExist = await Investor.findById({ _id: user });

  if (!investorExist) {
    throw new AppError('User not found.', 404);
  }

  const payload = {
    amountToInvest,
    investmentDuration,
    adminChargeFee,
    adminChargePercent,
  };

  const { error, value } = createInvestmentSchema.validate(payload);

  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  if (value.amountToInvest < 5000) {
    throw new AppError('The minimum amount that you can invest is $5,000', 400);
  }

  if (!allowedInvestmentDurationEnum.includes(value.investmentDuration)) {
    throw new AppError('Invalid investment duration');
  }

  let backendAdminChargePercent;

  if (value.amountToInvest >= 5000 && value.amountToInvest <= 50000) {
    backendAdminChargePercent = 5;
  } else if (value.amountToInvest > 50000) {
    backendAdminChargePercent = 3;
  }

  const backendAdminChargeFee =
    (backendAdminChargePercent * value.amountToInvest) / 100;

  if (value.adminChargePercent !== backendAdminChargePercent) {
    throw new AppError('Incorrect admin charge percent...', 400);
  }

  if (value.adminChargeFee !== backendAdminChargeFee) {
    throw new AppError('Incorrect admin charge fee...', 400);
  }

  console.log('backendAdminChargeFee:', backendAdminChargeFee);

  const newInvestment = new Investment({
    amountToInvest: value.amountToInvest,
    adminChargePercent: backendAdminChargePercent,
    investor: investorExist._id,
    duration: value.investmentDuration,
    adminChargeFee: backendAdminChargeFee,
  });

  const investment = await newInvestment.save();

  if (!investment) {
    throw new AppError('Unable to create investment.', 400);
  }

  return res.status(201).json({
    message: 'Investment created successfully.',
    success: true,
    status: 201,
    investment,
  });
});

const getAllInvestments = catchErrors(async (req, res) => {
  const { page, limit, searchParams } = req.query;
  let query = Investment.find().populate('investor', '-password');

  if (searchParams) {
    const regex = new RegExp(searchParams, 'i');

    query = query.where({
      $or: [
        { duration: { $regex: regex } },
        { amountToInvest: { $regex: regex } },
      ],
    });
  }

  if (!query) {
    throw new AppError('Investments not found.', 404);
  }

  const count = await query.clone().countDocuments();

  let pages = 0;

  if (page !== undefined && limit !== undefined && count !== 0) {
    const offset = (page - 1) * limit;

    query = query.skip(offset).limit(limit);

    pages = Math.ceil(count / limit);

    if (page > pages) {
      throw new AppError('Page can not be found.', 404);
    }
  }
  const response = await query.sort({ createdAt: -1 });

  if (!response || response.length === 0) {
    throw new AppError('Investments not found.', 404);
  }

  const investmentsWithPayments = await Promise.all(
    response.map(async (investment) => {
      const payment = await InvestmentPayment.findOne({
        investment: investment._id,
        investor: investment.investor._id,
      });

      return {
        ...investment.toObject(),
        investmentPaymentDoc: payment || null,
      };
    })
  );

  const investmentObject = {
    investments: investmentsWithPayments,
    totalPages: pages,
    totalCount: count,
  };

  return res.status(200).json({
    message: 'Investments found successfully',
    success: true,
    status: 200,
    investmentObject,
  });
});

const getAllInvestmentsNotYetApproved = catchErrors(async (req, res) => {
  const { page, limit, searchParams } = req.query;
  let query = Investment.find({
    isApprovedForInvestment: false,
  }).populate('investor', '-password');

  if (searchParams) {
    const regex = new RegExp(searchParams, 'i');

    query = query.where({
      $or: [
        { duration: { $regex: regex } },
        { amountToInvest: { $regex: regex } },
      ],
    });
  }

  if (!query) {
    throw new AppError('Investments not found.', 404);
  }

  const count = await query.clone().countDocuments();

  let pages = 0;

  if (page !== undefined && limit !== undefined && count !== 0) {
    const offset = (page - 1) * limit;

    query = query.skip(offset).limit(limit);

    pages = Math.ceil(count / limit);

    if (page > pages) {
      throw new AppError('Page can not be found.', 404);
    }
  }
  const response = await query.sort({ createdAt: -1 });

  if (!response || response.length === 0) {
    throw new AppError('Investments not found.', 404);
  }

  const investmentsWithPayments = await Promise.all(
    response.map(async (investment) => {
      const payment = await InvestmentPayment.findOne({
        investment: investment._id,
        investor: investment.investor._id,
      });

      return {
        ...investment.toObject(),
        investmentPaymentDoc: payment || null,
      };
    })
  );

  const investmentObject = {
    investments: investmentsWithPayments,
    totalPages: pages,
    totalCount: count,
  };

  return res.status(200).json({
    message: 'Investments found successfully',
    success: true,
    status: 200,
    investmentObject,
  });
});

const getASingleInvestment = catchErrors(async (req, res) => {
  const { investmentId } = req.params;

  if (!investmentId) {
    throw new AppError('Investment ID is required.', 400);
  }

  const investment = await Investment.findById({ _id: investmentId }).populate(
    'investor',
    '-password'
  );

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  // console.log('investment:', investment);

  const investmentWithPayment = await InvestmentPayment.findOne({
    investment: investment._id,
    investor: investment.investor._id,
  });

  const collapsedObj = {
    ...investment.toObject(),
    investmentPaymentDoc: investmentWithPayment,
  };
  console.log('collapsedObj:', collapsedObj);

  return res.status(200).json({
    message: 'Investment fetched successfully.',
    success: true,
    status: 200,
    investment: collapsedObj,
  });
});

const getmySingleInvestment = catchErrors(async (req, res) => {
  const { investmentId } = req.params;

  const user = req.user.userId;

  if (!investmentId) {
    throw new AppError('Investment ID is required.', 400);
  }

  const investment = await Investment.findOne({
    _id: investmentId,
    investor: user,
  });

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  const investmentWithPayment = await InvestmentPayment.findOne({
    investment: investment._id,
    investor: investment.investor._id,
  });

  const collapsedObj = {
    ...investment.toObject(),
    investmentPaymentDoc: investmentWithPayment,
  };
  console.log('collapsedObj:', collapsedObj);

  return res.status(200).json({
    message: 'Investment fetched successfully.',
    success: true,
    status: 200,
    investment: collapsedObj,
  });
});

const getAllMyInvestments = catchErrors(async (req, res) => {
  const user = req.user.userId;

  const { page, limit, searchParams } = req.query;
  let query = Investment.find({ investor: user });

  if (searchParams) {
    const regex = new RegExp(searchParams, 'i');

    query = query.where({
      $or: [
        { duration: { $regex: regex } },
        { amountToInvest: { $regex: regex } },
      ],
    });
  }

  if (!query) {
    throw new AppError('Investments not found.', 404);
  }

  const count = await query.clone().countDocuments();

  let pages = 0;

  if (page !== undefined && limit !== undefined && count !== 0) {
    const offset = (page - 1) * limit;

    query = query.skip(offset).limit(limit);

    pages = Math.ceil(count / limit);

    if (page > pages) {
      throw new AppError('Page can not be found.', 404);
    }
  }
  const response = await query.sort({ createdAt: -1 });

  if (!response || response.length === 0) {
    throw new AppError('Investments not found.', 404);
  }

  const investmentObject = {
    investments: response,
    totalPages: pages,
    totalCount: count,
  };

  return res.status(200).json({
    message: 'Investments found successfully',
    success: true,
    status: 200,
    investmentObject,
  });
});

const approveInvestmentToReceiveAdminCharges = catchErrors(async (req, res) => {
  const { investmentId } = req.params;

  if (!investmentId) {
    throw new AppError('Investment ID is required.', 400);
  }

  const investment = await Investment.findByIdAndUpdate(
    { _id: investmentId },
    { isApprovedForInvestment: true },
    { new: true }
  );

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  return res.status(200).json({
    message: 'Investment approved successfully.',
    success: true,
    status: 200,
    investment,
  });
});

const collectAdminCharges = catchErrors(async (req, res) => {
  const { investmentId } = req.params;

  if (!investmentId) {
    throw new AppError('Investment ID is required.', 400);
  }

  const user = req.user.userId;

  const investment = await Investment.findById({
    _id: investmentId,
  }).populate('investor');

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  if (!investment.investor.email) {
    throw new AppError('Investor email not found.', 404);
  }
  console.log('investment:', investment);

  if (investment.investor._id.toString() !== user.toString()) {
    throw new AppError('Not the authorized user', 400);
  }

  if (investment.isApprovedForInvestment !== true) {
    throw new AppError(
      'Investment not yet approved by admin for payment.',
      400
    );
  }

  const paymentInitialized = await InvestmentPayment.findOne({
    investment: investment._id,
    investor: investment.investor,
  });

  if (paymentInitialized) {
    throw new AppError(
      'This fee has already being initialized for payment before now.',
      400
    );
  }

  const exchangeRate = await getUsdToNgnRate();

  console.log('exchangeRate:', exchangeRate);

  if (!exchangeRate) {
    throw new AppError('Exchange rate is undefined.', 400);
  }

  const nairaValue = investment.adminChargeFee * exchangeRate;

  const paymentReferencePayload = {
    trainingId: investment._id,
    userId: investment.investor._id,
    paymentMode: investmentTransactionTypeEnum[0],
  };

  const reference = generatePaymentReference(paymentReferencePayload);

  const payload = {
    amountPaid: investment.adminChargeFee,
    userId: investment.investor._id,
    email: investment.investor.email,
    investmentId: investment._id,
    nairaValue: nairaValue,
    companyPaymentReference: reference,
    feeType: feeTypeEnum[1],
  };

  const result = await payStackInvestmentPaymentInitialized(payload);

  if (!result) {
    throw new AppError('Unable to process payment.', 400);
  }

  return res.status(200).json({
    message: 'Initialized payment successfully',
    data: result.response.data.data,
    success: true,
  });
});

const confirmPaystackInvestmentUrlValidity = catchErrors(async (req, res) => {
  const { reference } = req.params;

  const response = await paystackAuthUrlValidity(reference);

  const userId = req.user.userId;
  if (userId.toString() !== response.userId.toString()) {
    throw new AppError('Not the authorized user', 400);
  }

  const user = await Investor.findOne({
    _id: Object(response.userId),
    email: response.email,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const paymentDoc = await InvestmentPayment.findOne({
    investor: user._id,
    reference: response.reference,
  });

  if (!paymentDoc) {
    throw new AppError('Investment payment document not found.', 404);
  }

  console.log('paymentDoc:', paymentDoc);
  const investment = await Investment.findOne({
    investor: user._id,
    _id: paymentDoc.investment,
  });

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  if (investment.isApprovedForInvestment !== true) {
    throw new AppError('Admin charges is not yet approved for payment.', 400);
  }

  if (investment.isAdminChargesPaid !== false) {
    throw new AppError(
      'Admin charges for this investment has already being paid.',
      400
    );
  }

  if (response.message === 'Authorization URL has expired.') {
    if (paymentDoc) {
      await paymentDoc.deleteOne();
      throw new AppError('authorization url expired.', 400);
    }
  } else if (response.message === 'Authorization URL still valid.') {
    return res.status(200).json({
      message: 'Authorization URL validation successfully',
      authorizationUrl: paymentDoc.authorizationUrl,
      success: true,
      status: 200,
    });
  }
});

export {
  confirmPaystackInvestmentUrlValidity,
  getAllMyInvestments,
  collectAdminCharges,
  approveInvestmentToReceiveAdminCharges,
  getmySingleInvestment,
  getASingleInvestment,
  investmentInterest,
  getAllInvestments,
  getAllInvestmentsNotYetApproved,
};
