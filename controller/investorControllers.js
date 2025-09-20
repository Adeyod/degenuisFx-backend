import Investor from '../model/investorModel.js';
import {
  emailVerification,
  forgotPasswordSender,
} from '../utils/nodemailer.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { InvestorToken } from '../model/tokenModel.js';
import {
  generateAccessToken,
  generateRefreshToken,
  jwtDecodeRefreshToken,
} from '../middleware/jwtAuth.js';
import { RefreshToken } from '../model/refreshToken.js';
import BlackListedToken from '../model/blackListedmodel.js';
import jwt from 'jsonwebtoken';
import { getUserRefreshTokenDetails } from '../repository/tokenRepository.js';
import { AppError } from '../utils/app.error.js';
import catchErrors from '../utils/tryCatch.js';
import { getUserLocation } from '../utils/functions.js';
import { registerSchemaValidation } from '../utils/validation.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerInvestor = catchErrors(async (req, res) => {
  const payload = {
    firstName: req.body.firstName.trim().toLowerCase(),
    lastName: req.body.lastName.trim().toLowerCase(),
    middleName: req.body.middleName.trim().toLowerCase(),
    email: req.body.email.trim().toLowerCase(),
    password: req.body.password.trim(),
    confirmPassword: req.body.confirmPassword.trim(),
    phoneNumber: req.body.phoneNumber.trim(),
    address: req.body.address.trim().toLowerCase(),
    countryOfResidence: req.body.countryOfResidence.trim().toLowerCase(),
    stateOfResidence: req.body.stateOfResidence.trim().toLowerCase(),
    gender: req.body.gender.trim().toLowerCase(),
    DOB: req.body.DOB,
    coordinates: req.body.coordinates,
    role: req.body.role.toLowerCase(),
  };

  const { error, value } = registerSchemaValidation.validate(payload, {
    abortEarly: false,
  });

  if (error) {
    throw new AppError(error.details.map((d) => d.message).join(', '), 400);
  }

  const {
    firstName,
    lastName,
    middleName,
    email,
    password,
    phoneNumber,
    address,
    countryOfResidence,
    stateOfResidence,
    gender,
    DOB,
    coordinates,
    role,
  } = value;

  console.log('coordinates:', coordinates);

  const alreadyRegistered = await Investor.findOne({ email: email });
  if (alreadyRegistered) {
    throw new AppError('Email already exist', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const token =
    crypto.randomBytes(32).toString('hex') +
    crypto.randomBytes(32).toString('hex');

  const geoLocation = await getUserLocation(coordinates.long, coordinates.lat);
  const coords = {
    type: 'Point',
    placeId: coordinates.placeId,
    coordinates: [parseFloat(coordinates.long), parseFloat(coordinates.lat)],
  };

  const newInvestor = await new Investor({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    middleName: middleName ? middleName.toLowerCase() : '',
    email: email.toLowerCase(),
    password: hashedPassword,
    countryOfResidence: countryOfResidence.toLowerCase(),
    stateOfResidence: stateOfResidence.toLowerCase(),
    geoLocation: geoLocation.country,
    coords,
    gender: gender.toLowerCase(),
    DOB,
    address: address.toLowerCase(),
    phoneNumber,
    role,
  }).save();

  const newToken = await new InvestorToken({
    userId: newInvestor._id,
    token,
  }).save();

  const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

  await emailVerification(newInvestor.email, newInvestor.firstName, link);

  return res.status(201).json({
    message:
      'Investor registration is successful. Please verify your email with the link sent to you',
    success: true,
    status: 201,
  });
});

const verifyInvestorEmail = catchErrors(async (req, res) => {
  const { userId, token } = req.params;
  const checkToken = await InvestorToken.findOne({
    userId,
    token,
  });

  if (!checkToken) {
    throw new AppError('Token can not be found', 404);
  }

  const investorUpdate = await Investor.findByIdAndUpdate(
    { _id: userId },
    { $set: { isVerified: true } },
    { new: true }
  );

  if (!investorUpdate) {
    throw new AppError('Unable to update investor', 404);
  }

  await checkToken.deleteOne();

  const { password, ...others } = investorUpdate._doc;

  return res.json({
    message: 'Email verification successful',
    status: 200,
    success: true,
    investor: others,
  });
});

// i have done update for both student and investors

const loginInvestor = catchErrors(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('All fields are required', 400);
  }

  const isInvestor = await Investor.findOne({
    email,
  });

  if (!isInvestor) {
    throw new AppError('Invalid credentials', 400);
  }

  const validPassword = await bcrypt.compare(password, isInvestor.password);
  if (!validPassword) {
    throw new AppError('Invalid credentials', 400);
  }

  if (isInvestor.isVerified === false) {
    // check if there is a valid token and then send email again with the token.
    //if no valid token, generate another one and send email to the user

    const isValidToken = await InvestorToken.findOne({
      userId: isInvestor._id,
    });

    if (isValidToken) {
      const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${isValidToken.userId}&token=${isValidToken.token}`;

      await emailVerification(isInvestor.email, isInvestor.firstName, link);

      throw new AppError(
        'Please use the mail sent to your email address to verify your email',
        400
      );
    }

    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new InvestorToken({
      userId: isInvestor._id,
      token,
    }).save();

    const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

    await emailVerification(isInvestor.email, isInvestor.firstName, link);

    throw new AppError(
      'Please use the mail sent to your email address to verify your email',
      400
    );
  } else {
    const { password, coords, ...others } = isInvestor._doc;

    const jwtSign = await generateAccessToken(
      others._id,
      others.email,
      others.role
    );
    const refreshToken = await generateRefreshToken(
      others._id,
      others.email,
      others.role
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    await RefreshToken.findOneAndDelete({ userId: others._id });

    await new RefreshToken({
      token: hashedRefreshToken,
      userId: others._id,
      role: others.role,
    }).save();

    if (!jwtSign) {
      throw new AppError('Unable to sign user', 400);
    }

    const userObj = {
      ...others,
      placeId: coords.placeId,
      coordinates: {
        lat: coords.coordinates[1],
        long: coords.coordinates[0],
      },
    };

    return res.status(200).json({
      message: 'Investor logged in successfully',
      success: true,
      status: 200,
      user: userObj,
      accessToken: jwtSign,
      refreshToken,
    });
  }
});

const updateInvestor = catchErrors(async (req, res) => {
  const {
    address,
    countryOfResidence,
    nokAddress,
    nokName,
    nokPhoneNumber,
    nokRelationship,
    phoneNumber,
    stateOfResidence,

    // annualIncomeCurrency,
    // annualIncome,
    // netWorthCurrency,
    // netWorth,
    // sourceOfIncome,

    // two types of classes. regular and one on one classes
    // payment of admin charges

    //  THESE ARE NEEDED PROBABLY DURING INVESTMENT
    // investmentPackage,
    // investmentMode,
    // investmentModeOfPayment,

    // THESE ARE NOT NEEDED ANYMORE
    // bankName,
    // accountNumber,
    // accountName,
    // walletAddressUSDT,
    // acknowledgement,
  } = req.body;

  if (
    !nokName ||
    !nokRelationship ||
    !nokAddress ||
    !nokPhoneNumber ||
    !address ||
    !countryOfResidence ||
    !phoneNumber ||
    !stateOfResidence
  ) {
    throw new AppError('All fields are required', 400);
  }

  const trimmedNokName = nokName.trim();
  const trimmedNokRelationship = nokRelationship.trim();
  const trimmedNokAddress = nokAddress.trim();
  const trimmedAddress = address.trim();
  const trimmedCountryOfResidence = countryOfResidence.trim();
  const trimmedStateOfResidence = stateOfResidence.trim();

  if (forbiddenCharsRegex.test(trimmedNokName)) {
    throw new AppError('Invalid character at next-of-kin field', 400);
  }

  // 0-9+

  if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
    throw new AppError('Invalid character at state of residence field', 400);
  }

  if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
    throw new AppError('Invalid character at country of residence field', 400);
  }

  if (forbiddenCharsRegex.test(trimmedNokRelationship)) {
    throw new AppError('Invalid character at next-of-kin relationship', 400);
  }

  if (forbiddenCharsRegex.test(trimmedAddress)) {
    throw new AppError('Invalid character at address field', 400);
  }

  if (forbiddenCharsRegex.test(trimmedNokAddress)) {
    throw new AppError('Invalid character at next-of-kin address field', 400);
  }

  const user = req.user.userId;
  const { investorId } = req.params;

  if (user !== investorId) {
    throw new AppError('Not the authorized user', 400);
  }

  const findAndUpdateInvestor = await Investor.findByIdAndUpdate(
    {
      _id: investorId,
    },
    {
      address: trimmedAddress.toLowerCase(),
      countryOfResidence: trimmedCountryOfResidence.toLowerCase(),
      stateOfResidence: trimmedStateOfResidence.toLowerCase(),
      nokName: trimmedNokName.toLowerCase(),
      nokRelationship: trimmedNokRelationship.toLowerCase(),
      nokAddress: trimmedNokAddress.toLowerCase(),
      nokPhoneNumber,
      phoneNumber,

      isUpdated: true,
    },
    {
      new: true,
    }
  );

  if (!findAndUpdateInvestor) {
    throw new AppError('Investor not found', 400);
  }

  const { password, coords, ...others } = findAndUpdateInvestor._doc;

  const userObj = {
    ...others,
    placeId: coords.placeId,
    coordinates: {
      lat: coords.coordinates[1],
      long: coords.coordinates[0],
    },
  };

  return res.status(200).json({
    message: 'Investor profile updated successfully',
    success: true,
    status: 200,
    user: userObj,
  });
});

const getInvestor = catchErrors(async (req, res) => {
  const user = req.user.userId;
  const { investorId } = req.params;

  console.log('user:', user);
  console.log('investorId:', investorId);

  if (user !== investorId) {
    throw new AppError('Not the authorized user', 400);
  }

  const investorDetails = await Investor.findById({
    _id: investorId,
  });

  if (!investorDetails) {
    throw new AppError('Investor not found', 400);
  }

  const { password, coords, ...others } = investorDetails._doc;

  const userObj = {
    ...others,
    placeId: coords.placeId,
    coordinates: {
      lat: coords.coordinates[1],
      long: coords.coordinates[0],
    },
  };

  return res.status(200).json({
    message: ' Investor fetched successfully',
    success: true,
    status: 200,
    user: userObj,
  });
});

const investorLogout = catchErrors(async (req, res) => {
  const { refreshToken } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];
  const userId = req.user?.userId;

  console.log('refreshToken:', refreshToken);
  console.log('accessToken:', accessToken);
  console.log('userId:', userId);

  if (!refreshToken) {
    throw new AppError('Refresh Token is required to proceed.', 400);
  }

  if (!accessToken) {
    throw new AppError('No token found in the header.', 400);
  }

  const payload = {
    accessToken,
    refreshToken,
    userId,
  };

  const decoded = jwt.decode(payload.accessToken);

  console.log('decoded:', decoded);

  // If decode failed (invalid or expired token), fallback
  if (!decoded || !decoded.exp) {
    const fallbackExpiresAt = new Date(Date.now() + 60 * 1000); // 1 min fallback
    await new BlackListedToken({
      token: payload.accessToken,
      expires_at: fallbackExpiresAt,
    }).save();

    return {
      message: 'Access token invalid or expired. Forced logout successful.',
    };
  }

  const decodeRefreshToken = await jwtDecodeRefreshToken(payload.refreshToken);

  console.log('decodeRefreshToken:', decodeRefreshToken);

  const findToken = await getUserRefreshTokenDetails(decodeRefreshToken.userId);

  console.log('findToken:', findToken);

  if (findToken) {
    const compareToken = await bcrypt.compare(
      payload.refreshToken,
      findToken.token
    );

    console.log('compareToken:', compareToken);

    if (compareToken) {
      console.log('Refresh token matched. Removing it.');
      await RefreshToken.findByIdAndDelete({ _id: findToken._id });
    }
  } else {
    console.log('No refresh token stored for this user.');
  }

  const expiresAt = new Date(decoded.exp * 1000);

  await new BlackListedToken({
    token: payload.accessToken,
    expires_at: expiresAt,
  }).save();

  return res.status(200).json({
    message: 'User logged out successfully',
    success: true,
    status: 200,
  });
});

const forgotPassword = catchErrors(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const trimmedEmail = email.trim();

  // check the email field to prevent input of unwanted characters
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  const findUser = await Investor.findOne({ email });
  if (!findUser) {
    throw new AppError('Email not found', 400);
  } else {
    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new InvestorToken({
      token,
      userId: findUser._id,
    }).save();

    // const link = `${process.env.FRONTEND_URL}/investors/resetPassword/${newToken.userId}/${newToken.token}`;
    const link = `${process.env.FRONTEND_URL}/investors/resetPassword/?userId=${newToken.userId}&token=${newToken.token}`;

    const sendingForgotPassword = await forgotPasswordSender(
      email,
      link,
      findUser.firstName
    );
    if (!sendingForgotPassword.response) {
      throw new AppError('Unable to send email. Please try again', 400);
    } else {
      return res.status(200).json({
        message: 'Password reset link has been sent',
        success: true,
        status: 200,
      });
    }
  }
});

const resetPassword = catchErrors(async (req, res) => {
  const { userId, token } = req.params;
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    throw new AppError('All fields are required', 400);
  }

  // strong password check
  if (
    !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
      password
    )
  ) {
    throw new AppError(
      'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
      401
    );
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password do not match', 400);
  }

  const findToken = await InvestorToken.findOne({
    userId,
    token,
  });

  if (!findToken) {
    throw new AppError('Token not found', 404);
  }

  const findUser = await Investor.findById({
    _id: findToken.userId,
  });

  if (!findUser) {
    throw new AppError('User not found', 404);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  findUser.password = hashedPassword;
  await findUser.save();
  await findToken.deleteOne();

  return res.status(200).json({
    message: 'Password reset successfully. You can login',
    status: 200,
    success: true,
  });
});

const resendEmailVerification = catchErrors(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const trimmedEmail = email.trim();

  // check the email field to prevent input of unwanted characters
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  const findUser = await Investor.findOne({ email: trimmedEmail });

  if (!findUser) {
    throw new AppError('User not found', 404);
  }

  if (findUser.isVerified === true) {
    throw new AppError('User already verified', 400);
  }

  const checkTokenExist = await InvestorToken.findOne({
    userId: findUser._id,
  });

  if (checkTokenExist) {
    // const link = `${process.env.FRONTEND_URL}/investors/verify-email/${checkTokenExist.userId}/${checkTokenExist.token}`;

    const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${checkTokenExist.userId}&token=${checkTokenExist.token}`;

    await emailVerification(findUser.email, findUser.firstName, link);

    return res.status(200).json({
      message:
        'Verification link sent successfully. Please verify your email with the link sent to you',
      success: true,
      status: 200,
    });
  } else {
    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new InvestorToken({
      token,
      userId: findUser._id,
    }).save();

    // const link = `${process.env.FRONTEND_URL}/investors/verify-email/${newToken.userId}/${newToken.token}`;

    const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

    await emailVerification(findUser.email, findUser.firstName, link);

    return res.status(200).json({
      message:
        'Email verification link sent successfully. Please verify your email with the link sent to you',
      success: true,
      status: 200,
    });
  }
});

// admin
const getSingleInvestor = catchErrors(async (req, res) => {
  const { investorId } = req.params;

  const investorDetails = await Investor.findById({
    _id: investorId,
  });

  if (!investorDetails) {
    throw new AppError('Investor not found', 404);
  }

  const { password, coords, ...others } = investorDetails._doc;

  const userObj = {
    ...others,
    placeId: coords.placeId,
    coordinates: {
      lat: coords.coordinates[1],
      long: coords.coordinates[0],
    },
  };

  return res.status(200).json({
    message: ' investor fetched successfully',
    success: true,
    status: 200,
    investor: userObj,
  });
});

// get all investors
// const getAllInvestors = async (req, res) => {
//   try {
//     let query = Investor.find({
//       role: 'investor',
//     }).select('-password');

//     const page = parseInt(req.query.page) || 1;
//     const pageSize = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * pageSize;

//     const count = await Investor.countDocuments({
//       role: 'investor',
//     });

//     const pages = Math.ceil(count / pageSize);
//     query = query.skip(skip).limit(pageSize);
//     if (page > pages) {
//       return res.json({
//         error: 'Page limit exceeded',
//         status: 404,
//         success: false,
//       });
//     }

//     const result = await query;

//     if (!result) {
//       return res.json({
//         error: 'No investor found',
//         success: false,
//         status: 404,
//       });
//     } else {
//       return res.json({
//         message: 'investors found successfully',
//         success: true,
//         status: 200,
//         investors: result,
//         count,
//         pages,
//       });
//     }
//   } catch (error) {
//     return res.json({
//       error: error.message,
//       status: 500,
//       success: false,
//       message: 'Something happened',
//     });
//   }
// };

const getAllInvestors = catchErrors(async (req, res) => {
  const { page, limit, searchParams } = req.query;
  let query = Investor.find();

  if (searchParams) {
    const regex = new RegExp(searchParams, 'i');

    query = query
      .where({
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { middleName: { $regex: regex } },
          { gender: { $regex: regex } },
          { countryOfResidence: { $regex: regex } },
          { stateOfResidence: { $regex: regex } },
          { address: { $regex: regex } },
          { email: { $regex: regex } },
        ],
      })
      .select('-password');
  }

  if (!query) {
    throw new AppError('Investor not found', 404);
  }

  const count = await query.clone().countDocuments();

  let pages = 0;

  if (page !== undefined && limit !== undefined && count !== 0) {
    const offset = (page - 1) * limit;

    query = query.skip(offset).limit(limit);

    pages = Math.ceil(count / limit);

    if (page > pages) {
      throw new AppError('Page not found', 404);
    }
  }
  const response = await query.sort({ createdAt: -1 });

  if (!response || response.length === 0) {
    throw new AppError('Investors not found', 404);
  }

  const investorObject = {
    Investors: response,
    totalPages: pages,
    totalCount: count,
  };

  return res.status(200).json({
    message: 'Investors found successfully',
    success: true,
    status: 200,
    investorObject,
  });
});

const getInvestorsBySearch = catchErrors(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new AppError('Query parameter must be provided', 400);
  }

  const queryWord = query.split(' ').map((word) => new RegExp(word, 'i'));

  console.log(queryWord);

  const investors = await Investor.find({
    $or: [
      { firstName: { $in: queryWord } },
      { lastName: { $in: queryWord } },
      { middleName: { $in: queryWord } },
      { stateOfResidence: { $in: queryWord } },
      { countryOfResidence: { $in: queryWord } },
      { email: { $in: queryWord } },
      { address: { $in: queryWord } },
    ],
  }).select('-password');

  if (!investors || investors.length === 0 || investors === null) {
    throw new AppError('No matching investors found', 404);
  }

  return res.status(200).json({
    count: investors.length,
    message: 'Searches found',
    success: true,
    status: 200,
    investors,
  });
});

export {
  getInvestorsBySearch,
  investorLogout,
  getSingleInvestor,
  getAllInvestors,
  getInvestor,
  registerInvestor,
  verifyInvestorEmail,
  loginInvestor,
  forgotPassword,
  resetPassword,
  resendEmailVerification,
  updateInvestor,
};
