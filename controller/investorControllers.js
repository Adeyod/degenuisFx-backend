import Investor from '../model/investorModel.js';
import {
  emailVerification,
  forgotPasswordSender,
} from '../utils/nodemailer.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { InvestorToken } from '../model/tokenModel.js';
import { generateToken } from '../utils/jwtAuth.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerInvestor = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      address,
      countryOfResidence,
      stateOfResidence,
      gender,
      DOB,
      role,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !address ||
      !countryOfResidence ||
      !stateOfResidence ||
      !gender ||
      !DOB
    ) {
      return res.json({
        error: 'Please fill all mandatory fields',
        status: 400,
        success: false,
      });
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim();
    const trimmedCountryOfResidence = countryOfResidence.trim();
    const trimmedStateOfResidence = stateOfResidence.trim();
    const trimmedMiddleName = middleName.trim();

    if (forbiddenCharsRegex.test(trimmedFirstName)) {
      return res.json({
        error: `Invalid character in first name field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedLastName)) {
      return res.json({
        error: `Invalid character in last name field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedAddress)) {
      return res.json({
        error: `Invalid character in address field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
      return res.json({
        error: `Invalid character in country of residence field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
      return res.json({
        error: `Invalid character in state of residence field`,
        status: 400,
        success: false,
      });
    }

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    // // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        password
      )
    ) {
      return res.json({
        error:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        error: 'Password and confirm password do not match',
        status: 400,
        success: false,
      });
    }

    const alreadyRegistered = await Investor.findOne({ email: trimmedEmail });
    if (alreadyRegistered) {
      return res.json({
        error: 'Email already exist',
        status: 400,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    if (middleName !== '') {
      if (forbiddenCharsRegex.test(trimmedMiddleName)) {
        return res.json({
          error: `Invalid character in middle name field`,
          status: 400,
          success: false,
        });
      }

      const newInvestor = await new Investor({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        middleName: trimmedMiddleName,
        email: trimmedEmail,
        password: hashedPassword,
        countryOfResidence: trimmedCountryOfResidence,
        stateOfResidence: trimmedStateOfResidence,
        gender,
        DOB,
        address: trimmedAddress,
        phoneNumber,
        role,
      }).save();

      const newToken = await new InvestorToken({
        userId: newInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

      await emailVerification(
        newInvestor.email,
        newInvestor.firstName,
        link,
        next
      );

      return res.json({
        message:
          'Investor registration is successful. Please verify your email with the link sent to you',
        success: true,
      });
    } else {
      const newInvestor = await new Investor({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password: hashedPassword,
        countryOfResidence: trimmedCountryOfResidence,
        stateOfResidence: trimmedStateOfResidence,
        gender,
        DOB,
        address: trimmedAddress,
        phoneNumber,
        role,
      }).save();

      const newToken = await new InvestorToken({
        userId: newInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

      await emailVerification(
        newInvestor.email,
        newInvestor.firstName,
        link,
        next
      );

      return res.json({
        message:
          'Investor registration is successful. Please verify your email with the link sent to you',
        success: true,
      });
    }
  } catch (error) {
    next(error);
    // return res.json({
    //   error: error.message,
    //   status: 500,
    //   success: false,
    // });
  }
};

const verifyInvestorEmail = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const checkToken = await InvestorToken.findOne({
      userId,
      token,
    });

    if (!checkToken) {
      return res.json({
        error: 'Token can not be found',
        status: 404,
        success: false,
      });
    }

    const investorUpdate = await Investor.findByIdAndUpdate(
      { _id: userId },
      { $set: { isVerified: true } },
      { new: true }
    );

    if (!investorUpdate) {
      return res.json({
        error: 'Unable to update investor',
        success: false,
        status: 400,
      });
    }

    await checkToken.deleteOne();

    const { password, ...others } = investorUpdate._doc;

    return res.json({
      message: 'Email verification successful',
      status: 200,
      success: true,
      investor: others,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

// i have done update for both student and investors

const loginInvestor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const isInvestor = await Investor.findOne({
      email,
    });

    if (!isInvestor) {
      return res.json({
        error: 'Invalid credentials',
        status: 400,
        success: false,
      });
    }

    const validPassword = await bcrypt.compare(password, isInvestor.password);
    if (!validPassword) {
      return res.json({
        error: 'Invalid credential',
        status: 400,
        success: false,
      });
    }

    if (isInvestor.isVerified === false) {
      // check if there is a valid token and then send email again with the token.
      //if no valid token, generate another one and send email to the user

      const isValidToken = await InvestorToken.findOne({
        userId: isInvestor._id,
      });

      if (isValidToken) {
        const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${isValidToken.userId}&token=${isValidToken.token}`;

        await emailVerification(
          isInvestor.email,
          isInvestor.firstName,
          link,
          next
        );

        return res.json({
          message:
            'Please use the mail sent to your email address to verify your email',
          success: false,
          status: 400,
        });
      }

      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new InvestorToken({
        userId: isInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

      await emailVerification(
        isInvestor.email,
        isInvestor.firstName,
        link,
        next
      );

      return res.json({
        message:
          'Please use the mail sent to your email address to verify your email',
        success: false,
        status: 400,
      });
    } else {
      const { password, ...others } = isInvestor._doc;

      const jwtSign = await generateToken(res, isInvestor);

      if (!jwtSign) {
        return res.json({
          error: 'Unable to sign user',
          status: 400,
          success: false,
        });
      }
      return res.json({
        message: 'Investor logged in successfully',
        success: true,
        status: 200,
        user: others,
        token: jwtSign,
      });
    }
  } catch (error) {
    next(error);
    // return res.json({
    //   message: 'Something happened',
    //   status: 500,
    //   success: false,
    //   error: error.message,
    // });
  }
};

const updateInvestor = async (req, res) => {
  try {
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
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const trimmedNokName = nokName.trim();
    const trimmedNokRelationship = nokRelationship.trim();
    const trimmedNokAddress = address.trim();
    const trimmedAddress = nokAddress.trim();
    const trimmedCountryOfResidence = countryOfResidence.trim();
    const trimmedStateOfResidence = stateOfResidence.trim();

    if (forbiddenCharsRegex.test(trimmedNokName)) {
      return res.json({
        error: 'Invalid character at next-of-kin field',
        status: 400,
        success: false,
      });
    }

    // 0-9+

    if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
      return res.json({
        error: 'Invalid character at state of residence field',
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
      return res.json({
        error: 'Invalid character at country of residence field',
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedNokRelationship)) {
      return res.json({
        error: 'Invalid character at next-of-kin relationship',
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedAddress)) {
      return res.json({
        error: 'Invalid character at address field',
        success: false,
        status: 400,
      });
    }

    if (forbiddenCharsRegex.test(trimmedNokAddress)) {
      return res.json({
        error: 'Invalid character at next-of-kin address field',
        success: false,
        status: 400,
      });
    }

    const user = req.user.userId;
    const { investorId } = req.params;

    if (user !== investorId) {
      return res.json({
        error: 'Not the authorized user',
        status: 400,
        success: false,
      });
    }

    const findAndUpdateInvestor = await Investor.findByIdAndUpdate(
      {
        _id: investorId,
      },
      {
        address: trimmedAddress,
        countryOfResidence: trimmedCountryOfResidence,
        stateOfResidence: trimmedStateOfResidence,
        nokName: trimmedNokName,
        nokRelationship: trimmedNokRelationship,
        nokAddress: trimmedNokAddress,
        nokPhoneNumber,
        phoneNumber,

        isUpdated: true,
      },
      {
        new: true,
      }
    );

    if (!findAndUpdateInvestor) {
      return res.json({
        error: 'Investor not found',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = findAndUpdateInvestor._doc;

    return res.json({
      message: 'Investor profile updated successfully',
      success: true,
      status: 200,
      user: others,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const getInvestor = async (req, res) => {
  try {
    const user = req.user.userId;
    const { investorId } = req.params;

    if (user !== investorId) {
      return res.json({
        error: 'Not the authorized user',
      });
    }

    const investorDetails = await Investor.findById({
      _id: investorId,
    });

    if (!investorDetails) {
      return res.json({
        error: 'Investor not found',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = investorDetails._doc;

    return res.json({
      message: ' Investor fetched successfully',
      success: true,
      status: 200,
      user: others,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

const investorLogout = async (req, res) => {
  try {
    const userLogout = await res.clearCookie('token');
    if (!userLogout) {
      return res.json({
        error: 'Unable to log investor out. Please try again',
        status: 400,
        success: false,
      });
    } else {
      return res.json({
        message: 'Investor logout successful',
        status: 200,
        success: true,
      });
    }
  } catch (error) {
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({
        error: 'Email is required',
        status: 400,
        success: false,
      });
    }

    const trimmedEmail = email.trim();

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    const findUser = await Investor.findOne({ email });
    if (!findUser) {
      return res.json({
        error: 'Email not found',
        success: false,
        status: 404,
      });
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
        findUser.firstName,
        next
      );
      if (!sendingForgotPassword.response) {
        return res.json({
          error: 'Unable to send email. Please try again',
          success: false,
          status: 400,
        });
      } else {
        return res.json({
          message: 'Password reset link has been sent',
          success: true,
          status: 200,
        });
      }
    }
  } catch (error) {
    next(error);
    // return res.json({
    //   error: error.message,
    //   message: 'Something happened',
    //   success: false,
    //   status: 500,
    // });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res.json({
        status: 400,
        error: 'All fields are required',
        success: false,
      });
    }

    // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        password
      )
    ) {
      return res.json({
        error:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        error: 'Password and confirm password do not match',
        status: 400,
        success: false,
      });
    }

    const findToken = await InvestorToken.findOne({
      userId,
      token,
    });

    if (!findToken) {
      return res.json({
        error: 'Token not found',
        success: false,
        status: 404,
      });
    }

    const findUser = await Investor.findById({
      _id: findToken.userId,
    });

    if (!findUser) {
      return res.json({
        error: 'User not found',
        status: 404,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    findUser.password = hashedPassword;
    await findUser.save();
    await findToken.deleteOne();

    return res.json({
      message: 'Password reset successfully. You can login',
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      message: 'Something happened',
      success: false,
      status: 500,
    });
  }
};

const resendEmailVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({
        error: 'Email is required',
        status: 400,
        success: false,
      });
    }

    const trimmedEmail = email.trim();

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    const findUser = await Investor.findOne({ email: trimmedEmail });

    if (!findUser) {
      return res.json({
        error: 'User not found',
        success: false,
        status: 404,
      });
    }

    if (findUser.isVerified === true) {
      return res.json({
        error: 'User already verified',
        success: false,
        status: 400,
      });
    }

    const checkTokenExist = await InvestorToken.findOne({
      userId: findUser._id,
    });

    if (checkTokenExist) {
      // const link = `${process.env.FRONTEND_URL}/investors/verify-email/${checkTokenExist.userId}/${checkTokenExist.token}`;

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/?userId=${checkTokenExist.userId}&token=${checkTokenExist.token}`;

      await emailVerification(findUser.email, findUser.firstName, link, next);

      return res.json({
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

      await emailVerification(findUser.email, findUser.firstName, link, next);

      return res.json({
        message:
          'Email verification link sent successfully. Please verify your email with the link sent to you',
        success: true,
        status: 200,
      });
    }
  } catch (error) {
    next(error);
    // return res.json({
    //   error: error.message,
    //   message: 'Something happened',
    //   success: false,
    //   status: 500,
    // });
  }
};

// admin
const getSingleInvestor = async (req, res) => {
  try {
    const { investorId } = req.params;

    const investorDetails = await Investor.findById({
      _id: investorId,
    });

    if (!investorDetails) {
      return res.json({
        error: 'Investor not found',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = investorDetails._doc;

    return res.json({
      message: ' investor fetched successfully',
      success: true,
      status: 200,
      investor: others,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      status: 500,
      success: false,
      error: error.message,
    });
  }
};

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

const getAllInvestors = async (req, res) => {
  try {
    const { page, limit } = req.query;

    let pages;
    let investors;
    let count;

    if (!page) {
      investors = await Investor.find({
        role: 'investor',
      }).select('-password');
      count = investors.length;
      pages = 1;
    } else {
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;

      // Calculate skip value for pagination
      const skip = (pageNumber - 1) * pageSize;

      // Find the count of total documents
      count = await Investor.countDocuments({ role: 'investor' });

      pages = Math.ceil(count / pageSize);

      if (pageNumber > pages) {
        return res.json({
          error: 'Page limit exceeded',
          status: 404,
          success: false,
        });
      }

      // Query for fetching investors with pagination
      investors = await Investor.find({ role: 'investor' })
        .select('-password')
        .skip(skip)
        .limit(pageSize);

      // if no investors found, return an appropriate message
      if (!investors.length) {
        return res.json({
          error: 'No investors found',
          success: false,
          status: 404,
        });
      }
    }

    // Return fetched investors along with pagination info
    return res.json({
      message: 'investors found successfully',
      success: true,
      status: 200,
      investors,
      count,
      pages,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      status: 500,
      success: false,
      message: 'Something happened',
    });
  }
};

const getInvestorsBySearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({
        error: 'Query parameter must be provided',
        success: false,
        status: 400,
      });
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
      return res.json({
        error: 'No matching investors found',
        status: 404,
        success: false,
      });
    }

    return res.json({
      count: investors.length,
      message: 'Searches found',
      success: true,
      status: 200,
      investors,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      status: 500,
      success: false,
      message: 'Something happened',
    });
  }
};

const invest = async (req, res) => {
  try {
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

export {
  invest,
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
