import Investment from '../model/investmentModel.js';
import Investor from '../model/investorModel.js';
import { AppError } from '../utils/app.error.js';
import { allowedInvestmentDurationEnum } from '../utils/enumModules.js';
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

  if (value.amountToInvest > 5000 && value.amountToInvest <= 50000) {
    backendAdminChargePercent = 5;
    console.log('backendAdminChargePercent:', backendAdminChargePercent);
  } else if (value.amountToInvest > 50000) {
    backendAdminChargePercent = 3;
    console.log('backendAdminChargePercent:', backendAdminChargePercent);
  }

  const backendAdminChargeFee =
    backendAdminChargePercent * value.amountToInvest;
  if (
    value.adminChargeFee !== backendAdminChargeFee ||
    value.adminChargePercent !== backendAdminChargePercent
  ) {
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

const getASingleInvestment = catchErrors(async (req, res) => {
  const { investmentId } = req.params;

  if (!investmentId) {
    throw new AppError('Investment ID is required.', 400);
  }

  const investment = await Investment.findById({ _id: investmentId });

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  return res.status(200).json({
    message: 'Investment fetched successfully.',
    success: true,
    status: 200,
    investment,
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

  return res.status(200).json({
    message: 'Investment fetched successfully.',
    success: true,
    status: 200,
    investment,
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

  const investment = await Investment.findById({
    _id: investmentId,
  });

  if (!investment) {
    throw new AppError('Investment not found.', 404);
  }

  if (investment.isApprovedForInvestment !== true) {
    throw new AppError(
      'Investment not yet approved by admin for payment.',
      404
    );
  }
});

export {
  collectAdminCharges,
  approveInvestmentToReceiveAdminCharges,
  getmySingleInvestment,
  getASingleInvestment,
  investmentInterest,
  getAllInvestments,
  getAllInvestmentsNotYetApproved,
};
