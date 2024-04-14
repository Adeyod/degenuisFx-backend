import Student from '../model/studentModel.js';
import { emailVerification } from '../utils/nodemailer.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { StudentToken } from '../model/tokenModel.js';
import { generateToken } from '../utils/jwtAuth.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerStudent = async (req, res) => {
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

    const alreadyRegistered = await Student.findOne({ email: trimmedEmail });
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

      const newStudent = await new Student({
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

      const newToken = await new StudentToken({
        userId: newStudent._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(newStudent.email, newStudent.firstName, link);

      return res.json({
        message:
          'Student registration is successful. Please verify your email with the link sent to you',
        success: true,
      });
    } else {
      const newStudent = await new Student({
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

      const newToken = await new StudentToken({
        userId: newStudent._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(newStudent.email, newStudent.firstName, link);

      return res.json({
        message:
          'Student registration is successful. Please verify your email with the link sent to you',
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

const verifyStudentEmail = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const checkToken = await StudentToken.findOne({
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

    const studentUpdate = await Student.findByIdAndUpdate(
      { _id: userId },
      { $set: { isVerified: true } },
      { new: true }
    );

    if (!studentUpdate) {
      return res.json({
        error: 'Unable to update student',
        success: false,
        status: 400,
      });
    }

    await checkToken.deleteOne();

    const { password, ...others } = studentUpdate._doc;

    return res.json({
      message: 'Email verification successful',
      status: 200,
      success: true,
      student: others,
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

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const isStudent = await Student.findOne({
      email,
    });

    if (!isStudent) {
      return res.json({
        error: 'Invalid credentials',
        status: 400,
        success: false,
      });
    }

    const validPassword = await bcrypt.compare(password, isStudent.password);
    if (!validPassword) {
      return res.json({
        error: 'Invalid credential',
        status: 400,
        success: false,
      });
    }

    if (isStudent.isVerified === false) {
      // check if there is a valid token and then send email again with the token.
      //if no valid token, generate another one and send email to the user

      const isValidToken = await StudentToken.findOne({
        userId: isStudent._id,
      });

      if (isValidToken) {
        const link = `${process.env.FRONTEND_URL}/student/verify-email/${isValidToken.userId}/${isValidToken.token}`;

        await emailVerification(isStudent.email, isStudent.firstName, link);

        return res.json({
          message:
            'Please use the mail sent to your email address to verify your email',
        });
      }

      const token =
        crypto.randomBytes(32).toString('hex') +
        crypto.randomBytes(32).toString('hex');

      const newToken = await new StudentToken({
        userId: isStudent._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

      await emailVerification(isStudent.email, isStudent.firstName, link);

      return res.json({
        message:
          'Please use the mail sent to your email address to verify your email',
      });
    } else {
      const { password, ...others } = isStudent._doc;

      const jwtSign = await generateToken(res, isStudent);

      if (!jwtSign) {
        return res.json({
          error: 'Unable to sign user',
          status: 400,
          success: false,
        });
      }
      return res.json({
        message: 'Student fetched successfully',
        success: true,
        status: 200,
        student: others,
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

const getStudent = async (req, res) => {
  try {
    const user = req.user.userId;
    const { studentId } = req.params;

    if (user !== studentId) {
      return res.json({
        error: 'Not the authorized user',
      });
    }

    const studentDetails = await Student.findById({
      _id: studentId,
    });

    if (!studentDetails) {
      return res.json({
        error: 'Student not found',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = studentDetails._doc;

    return res.json({
      message: ' Student fetched successfully',
      success: true,
      status: 200,
      student: others,
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

export { getStudent, registerStudent, verifyStudentEmail, loginStudent };
