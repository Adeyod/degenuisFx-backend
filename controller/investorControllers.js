import Investor from '../model/investorModel.js';
import { emailVerification } from '../utils/nodemailer.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { InvestorToken } from '../model/tokenModel.js';
import { generateToken } from '../utils/jwtAuth.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerInvestor = async (req, res) => {
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
        message: 'Please fill all mandatory fields',
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
        message: `Invalid character in first name field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedLastName)) {
      return res.json({
        message: `Invalid character in last name field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedAddress)) {
      return res.json({
        message: `Invalid character in address field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
      return res.json({
        message: `Invalid character in country of residence field`,
        status: 400,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
      return res.json({
        message: `Invalid character in state of residence field`,
        status: 400,
        success: false,
      });
    }

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        message: 'Invalid input for email...',
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
        message:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        message: 'Password and confirm password do not match',
        status: 400,
        success: false,
      });
    }

    const alreadyRegistered = await Investor.findOne({ email: trimmedEmail });
    if (alreadyRegistered) {
      return res.json({
        message: 'Email already exist',
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
          message: `Invalid character in middle name field`,
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
      }).save();

      const newToken = await new InvestorToken({
        userId: newInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(newInvestor.email, newInvestor.firstName, link);

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
      }).save();

      const newToken = await new InvestorToken({
        userId: newInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(newInvestor.email, newInvestor.firstName, link);

      return res.json({
        message:
          'Investor registration is successful. Please verify your email with the link sent to you',
        success: true,
      });
    }
  } catch (error) {
    return res.json({
      error: error.message,
      status: 500,
      success: false,
    });
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
        message: 'Token can not be found',
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
        message: 'Unable to update investor',
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

const loginInvestor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        message: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const isInvestor = await Investor.findOne({
      email,
    });

    if (!isInvestor) {
      return res.json({
        message: 'Invalid credentials',
        status: 400,
        success: false,
      });
    }

    const validPassword = await bcrypt.compare(password, isInvestor.password);
    if (!validPassword) {
      return res.json({
        message: 'Invalid credential',
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
        const link = `${process.env.FRONTEND_URL}/investors/verify-email/${isValidToken.userId}/${isValidToken.token}`;

        await emailVerification(isInvestor.email, isInvestor.firstName, link);

        return res.json({
          message:
            'Please use the mail sent to your email address to verify your email',
        });
      }

      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new InvestorToken({
        userId: isInvestor._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/investors/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(isInvestor.email, isInvestor.firstName, link);

      return res.json({
        message:
          'Please use the mail sent to your email address to verify your email',
      });
    } else {
      const { password, ...others } = isInvestor._doc;

      const jwtSign = await generateToken(res, isInvestor);

      if (!jwtSign) {
        return res.json({
          message: 'Unable to sign user',
          status: 400,
          success: false,
        });
      }
      return res.json({
        message: 'Investor fetched successfully',
        success: true,
        status: 200,
        investor: others,
      });
    }
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
        message: 'Not the authorized user',
      });
    }

    const investorDetails = await Investor.findById({
      _id: investorId,
    });

    if (!investorDetails) {
      return res.json({
        message: 'Investor not found',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = investorDetails._doc;

    return res.json({
      message: ' Investor fetched successfully',
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

export { getInvestor, registerInvestor, verifyInvestorEmail, loginInvestor };
