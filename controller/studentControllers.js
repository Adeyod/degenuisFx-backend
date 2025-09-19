import Student from '../model/studentModel.js';
import {
  emailVerification,
  forgotPasswordSender,
} from '../utils/nodemailer.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { StudentToken } from '../model/tokenModel.js';
import {
  generateAccessToken,
  generateRefreshToken,
  jwtDecodeRefreshToken,
} from '../middleware/jwtAuth.js';
import { RefreshToken } from '../model/refreshToken.js';
import BlackListedToken from '../model/blackListedmodel.js';
import { getUserRefreshTokenDetails } from '../repository/tokenRepository.js';
import jwt from 'jsonwebtoken';
import Payment from '../model/paymentModel.js';
import Enrollment from '../model/enrollmentModel.js';
import Training from '../model/trainingModel.js';
import { AppError } from '../utils/app.error.js';
import catchErrors from '../utils/tryCatch.js';
import { getUserLocation } from '../utils/functions.js';
import { preferredTrainingDaysEnum } from '../utils/enumModules.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const registerStudent = catchErrors(async (req, res) => {
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
    coordinates,
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
    !DOB ||
    !coordinates
  ) {
    throw new AppError('Please fill all mandatory fields', 400);
  }

  // coordinates = {
  //   long: '',
  //   lat: '',
  // };

  console.log('coordinates:', coordinates);
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedAddress = address.trim();
  const trimmedEmail = email.trim();
  const trimmedCountryOfResidence = countryOfResidence.trim();
  const trimmedStateOfResidence = stateOfResidence.trim();
  const trimmedMiddleName = middleName.trim();

  if (forbiddenCharsRegex.test(trimmedFirstName)) {
    throw new AppError(`Invalid character in first name field`, 400);
  }

  if (forbiddenCharsRegex.test(trimmedLastName)) {
    throw new AppError(`Invalid character in last name field`, 400);
  }

  if (forbiddenCharsRegex.test(trimmedAddress)) {
    throw new AppError(`Invalid character in address field`, 400);
  }

  if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
    throw new AppError(`Invalid character in country of residence field`, 400);
  }

  if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
    throw new AppError(`Invalid character in state of residence field`, 400);
  }

  // check the email field to prevent input of unwanted characters
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  // // strong password check
  if (
    !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
      password
    )
  ) {
    throw new AppError(
      'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
      400
    );
  }

  if (
    typeof coordinates.long !== 'number' ||
    typeof coordinates.lat !== 'number'
  ) {
    throw new AppError('Long and lat must be number.', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password do not match', 400);
  }

  const alreadyRegistered = await Student.findOne({ email: trimmedEmail });
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
    coordinates: [parseFloat(coordinates.long), parseFloat(coordinates.lat)],
  };

  if (middleName !== '') {
    if (forbiddenCharsRegex.test(trimmedMiddleName)) {
      throw new AppError(`Invalid character in middle name field`, 400);
    }

    const newStudent = await new Student({
      firstName: trimmedFirstName.toLowerCase(),
      lastName: trimmedLastName.toLowerCase(),
      middleName: trimmedMiddleName.toLowerCase(),
      email: trimmedEmail.toLowerCase(),
      password: hashedPassword,
      countryOfResidence: trimmedCountryOfResidence.toLowerCase(),
      stateOfResidence: trimmedStateOfResidence.toLowerCase(),
      geoLocation: geoLocation.country,
      coords,
      gender: gender.toLowerCase(),
      DOB,
      address: trimmedAddress,
      phoneNumber,
      role,
    }).save();

    const newToken = await new StudentToken({
      userId: newStudent._id,
      token,
    }).save();

    const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

    await emailVerification(newStudent.email, newStudent.firstName, link);

    return res.status(201).json({
      message:
        'Student registration is successful. Please verify your email with the link sent to you',
      success: true,
      status: 201,
    });
  } else {
    const newStudent = await new Student({
      firstName: trimmedFirstName.toLowerCase(),
      lastName: trimmedLastName.toLowerCase(),
      email: trimmedEmail.toLowerCase(),
      password: hashedPassword,
      countryOfResidence: trimmedCountryOfResidence.toLowerCase(),
      stateOfResidence: trimmedStateOfResidence.toLowerCase(),
      geoLocation: geoLocation.country,
      coords,
      gender: gender.toLowerCase(),
      DOB,
      role,
      address: trimmedAddress.toLowerCase(),
      phoneNumber,
    }).save();

    const newToken = await new StudentToken({
      userId: newStudent._id,
      token,
    }).save();

    // const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

    const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

    await emailVerification(newStudent.email, newStudent.firstName, link);

    return res.status(201).json({
      message:
        'Student registration is successful. Please verify your email with the link sent to you',
      success: true,
      status: 201,
    });
  }
});

const verifyStudentEmail = catchErrors(async (req, res) => {
  const { userId, token } = req.params;
  const checkToken = await StudentToken.findOne({
    userId,
    token,
  });

  if (!checkToken) {
    throw new AppError('Token can not be found', 404);
  }

  const studentUpdate = await Student.findByIdAndUpdate(
    { _id: userId },
    { $set: { isVerified: true } },
    { new: true }
  );

  if (!studentUpdate) {
    throw new AppError('Unable to update student', 400);
  }

  await checkToken.deleteOne();

  const { password, ...others } = studentUpdate._doc;

  return res.status(200).json({
    message: 'Email verification successful',
    status: 200,
    success: true,
    student: others,
  });
});

const loginStudent = catchErrors(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('All fields are required', 400);
  }

  const isStudent = await Student.findOne({
    email,
  });

  if (!isStudent) {
    throw new AppError('Invalid credentials', 400);
  }

  const validPassword = await bcrypt.compare(password, isStudent.password);
  if (!validPassword) {
    throw new AppError('Invalid credentials', 400);
  }

  if (isStudent.isVerified === false) {
    // check if there is a valid token and then send email again with the token.
    //if no valid token, generate another one and send email to the user

    const isValidToken = await StudentToken.findOne({
      userId: isStudent._id,
    });

    if (isValidToken) {
      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${isValidToken.userId}&token=${isValidToken.token}`;

      await emailVerification(isStudent.email, isStudent.firstName, link);

      throw new AppError(
        'Please use the mail sent to your email address to verify your email',
        400
      );
    }

    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new StudentToken({
      userId: isStudent._id,
      token,
    }).save();

    const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

    await emailVerification(isStudent.email, isStudent.firstName, link);

    throw new AppError(
      'Please use the mail sent to your email address to verify your email',
      400
    );
  } else {
    const { password, ...others } = isStudent._doc;

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

    // const training = await Training.find();

    // const studentPaymentDocs = await Payment.findOne({
    //   userId: others._id,
    //   training: training[0]._id,
    // });

    // const studentEnrollmentDocs = await Enrollment.findOne({
    //   userId: others._id,
    //   training: training[0]._id,
    // });

    await new RefreshToken({
      token: hashedRefreshToken,
      userId: others._id,
      role: others.role,
    }).save();

    if (!jwtSign) {
      throw new AppError('Unable to sign user', 400);
    }
    return res.status(200).json({
      message: `${others.role} login successfully`,
      success: true,
      status: 200,
      user: others,
      // paymentDoc: studentPaymentDocs && studentPaymentDocs,
      // enrollement: studentEnrollmentDocs ? studentEnrollmentDocs : null,
      accessToken: jwtSign,
      refreshToken,
    });
  }
});

const updateStudent = catchErrors(async (req, res) => {
  const {
    levelOfForexExperience,
    preferredTrainingDays,
    infoSource,
    countryOfResidence,
    stateOfResidence,
    address,
    phoneNumber,
  } = req.body;

  if (
    !address ||
    !countryOfResidence ||
    !levelOfForexExperience ||
    !infoSource ||
    !phoneNumber ||
    !stateOfResidence ||
    !Array.isArray(preferredTrainingDays) ||
    preferredTrainingDays.length === 0
  ) {
    throw new AppError(
      'All fields are required and training days must be an array...',
      400
    );
  }

  const trimmedAddress = address.trim();
  const trimmedCountryOfResidence = countryOfResidence.trim();
  const trimmedStateOfResidence = stateOfResidence.trim();
  const trimmedPreferredTrainingDays = preferredTrainingDays.trim();

  if (forbiddenCharsRegex.test(trimmedStateOfResidence)) {
    throw new AppError('Invalid character at state of residence', 400);
  }

  if (forbiddenCharsRegex.test(trimmedCountryOfResidence)) {
    throw new AppError('Invalid character at country of residence field', 400);
  }

  if (forbiddenCharsRegex.test(trimmedAddress)) {
    throw new AppError('Invalid character at address field', 400);
  }

  const allowedDays = preferredTrainingDaysEnum;

  const normalizedDays = preferredTrainingDays.map((day) =>
    day.toLowerCase().trim()
  );
  const invalidDays = normalizedDays.filter(
    (day) => !allowedDays.includes(day)
  );
  if (invalidDays.length > 0) {
    throw new AppError(`Invalid training days: ${invalidDays.join(', ')}`, 400);
  }

  const user = req.user.userId;

  const { studentId } = req.params;

  if (user !== studentId) {
    throw new AppError('Not the authorized user', 400);
  }

  const findAndUpdateStudent = await Student.findByIdAndUpdate(
    {
      _id: studentId,
    },
    {
      levelOfForexExperience: levelOfForexExperience.toLowerCase(),
      preferredTrainingDays: normalizedDays,
      infoSource: infoSource.toLowerCase(),
      address: trimmedAddress.toLowerCase(),
      countryOfResidence: trimmedCountryOfResidence.toLowerCase(),
      stateOfResidence: trimmedStateOfResidence.toLowerCase(),
      phoneNumber,
      isUpdated: true,
    },
    {
      new: true,
    }
  );

  if (!findAndUpdateStudent) {
    throw new AppError('unable to update student', 404);
  }

  const { password, ...others } = findAndUpdateStudent._doc;

  const training = await Training.find();

  const studentPaymentDocs = await Payment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  if (studentPaymentDocs?.paymentSummary) {
    studentPaymentDocs.paymentSummary.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  const studentEnrollmentDocs = await Enrollment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  return res.status(200).json({
    message: `Student profile updated successfully`,
    success: true,
    status: 200,
    paymentDoc: studentPaymentDocs && studentPaymentDocs,
    enrollment: studentEnrollmentDocs ? studentEnrollmentDocs : null,
    user: others,
  });
});

const getStudent = catchErrors(async (req, res) => {
  const user = req.user.userId;
  const { studentId } = req.params;

  if (user !== studentId) {
    throw new AppError('Not the authorized user', 401);
  }

  const studentDetails = await Student.findById({
    _id: studentId,
  });

  if (!studentDetails) {
    throw new AppError('Student not found', 404);
  }

  const training = await Training.find();

  const { password, ...others } = studentDetails._doc;

  const studentPaymentDocs = await Payment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  if (studentPaymentDocs?.paymentSummary) {
    studentPaymentDocs.paymentSummary.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  const studentEnrollmentDocs = await Enrollment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  return res.status(200).json({
    message: ' Student fetched successfully',
    success: true,
    status: 200,
    user: others,
    paymentDoc: studentPaymentDocs && studentPaymentDocs,
    enrollment: studentEnrollmentDocs ? studentEnrollmentDocs : null,
  });
});

const studentLogout = catchErrors(async (req, res) => {
  // const userLogout2 = await res.cookie('token', '', { maxAge: 1 });
  // const userLogout = await res.clearCookie('token', { httpOnly: true });
  // if (!userLogout) {
  //   return res.json({
  //     error: 'unable to log out',
  //     success: false,
  //     status: 400,
  //   });
  // } else {
  //   return res.json({
  //     message: 'User logged out successfully',
  //     success: true,
  //     status: 200,
  //   });
  // }

  const { refreshToken } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];
  const userId = req.user?.userId;

  console.log('refreshToken:', refreshToken);
  console.log('accessToken:', accessToken);
  // console.log('userId:', userId);

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

  console.log('payload:', payload);
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

  const findToken = await getUserRefreshTokenDetails(decodeRefreshToken.userId);

  if (findToken) {
    const compareToken = await bcrypt.compare(
      payload.refreshToken,
      findToken.token
    );

    if (compareToken) {
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

  res.status(200).json({
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

  const findUser = await Student.findOne({ email });
  if (!findUser) {
    throw new AppError('Email not found', 404);
  } else {
    const token =
      crypto.randomBytes(32).toString('hex') +
      crypto.randomBytes(32).toString('hex');

    const newToken = await new StudentToken({
      token,
      userId: findUser._id,
    }).save();

    // const link = `${process.env.FRONTEND_URL}/student/resetPassword/${newToken.userId}/${newToken.token}`;
    const link = `${process.env.FRONTEND_URL}/student/resetPassword/?userId=${newToken.userId}&token=${newToken.token}`;

    const sendingForgotPassword = await forgotPasswordSender(
      email,
      link,
      findUser.firstName
    );
    console.log('FORGOT PASSWORD:', sendingForgotPassword);

    if (sendingForgotPassword) {
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
      400
    );
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password do not match', 400);
  }

  const findToken = await StudentToken.findOne({
    userId,
    token,
  });

  if (!findToken) {
    throw new AppError('Token not found', 404);
  }

  const findUser = await Student.findById({
    _id: findToken.userId,
  });

  if (!findUser) {
    throw new AppError('User not found', 400);
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

  const findUser = await Student.findOne({ email: trimmedEmail });

  if (!findUser) {
    throw new AppError('User not found', 404);
  }

  if (findUser.isVerified === true) {
    throw new AppError('User already verified', 400);
  }

  const checkTokenExist = await StudentToken.findOne({
    userId: findUser._id,
  });

  if (checkTokenExist) {
    // const link = `${process.env.FRONTEND_URL}/student/verify-email/${checkTokenExist.userId}/${checkTokenExist.token}`;

    const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${checkTokenExist.userId}&token=${checkTokenExist.token}`;

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

    const newToken = await new StudentToken({
      token,
      userId: findUser._id,
    }).save();

    // const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

    const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

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
const getSingleStudent = catchErrors(async (req, res) => {
  const { studentId } = req.params;

  const studentDetails = await Student.findById({
    _id: studentId,
  });

  if (!studentDetails) {
    throw new AppError('Student not found', 404);
  }

  const { password, ...others } = studentDetails._doc;

  const training = await Training.find();

  const studentPaymentDocs = await Payment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  if (studentPaymentDocs?.paymentSummary) {
    studentPaymentDocs.paymentSummary.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  const studentEnrollmentDocs = await Enrollment.findOne({
    userId: others._id,
    training: training[0]._id,
  });

  return res.status(200).json({
    message: ' Student fetched successfully',
    success: true,
    status: 200,
    student: others,
    paymentDoc: studentPaymentDocs && studentPaymentDocs,
    enrollment: studentEnrollmentDocs ? studentEnrollmentDocs : null,
  });
});

// get all students
// const getAllStudents = async (req, res) => {
//   try {
//     let query = Student.find({
//       role: 'student',
//     }).select('-password');

//     const page = req.query.page || 1;
//     const pageSize = req.query.limit || 10;
//     const skip = (page - 1) * pageSize;

//     const count = await Student.countDocuments({
//       role: 'student',
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
//         error: 'No student found',
//         success: false,
//         status: 404,
//       });
//     } else {
//       return res.json({
//         message: 'Students found successfully',
//         success: true,
//         status: 200,
//         students: result,
//         pages,
//         count,
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

const getAllStudents = catchErrors(async (req, res) => {
  const { page, limit, searchParams } = req.query;
  let query = Student.find();

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
    throw new AppError('Students not found.', 404);
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
    throw new AppError('Students not found.', 404);
  }

  const studentObject = {
    students: response,
    totalPages: pages,
    totalCount: count,
  };

  return res.status(200).json({
    message: 'Students found successfully',
    success: true,
    status: 200,
    studentObject,
  });
});

const getStudentsBySearch = catchErrors(async (req, res) => {
  const { query } = await req.query;

  const queryWord = query.split(' ').map((word) => new RegExp(word, 'i'));

  const students = await Student.find({
    $or: [
      { firstName: { $in: queryWord } },
      { lastName: { $in: queryWord } },
      { middleName: { $in: queryWord } },
      { countryOfResidence: { $in: queryWord } },
      { stateOfResidence: { $in: queryWord } },
      { address: { $in: queryWord } },
      { email: { $in: queryWord } },
    ],
  }).select('-password');

  if (!students || students.length === 0 || students === null) {
    throw new AppError('No matching students found', 404);
  }

  return res.status(200).json({
    count: students.length,
    message: 'Searches found',
    status: 200,
    success: true,
    students,
  });
});

const subscribeToCourse = catchErrors(async (req, res) => {});

export {
  updateStudent,
  subscribeToCourse,
  studentLogout,
  getSingleStudent,
  getStudent,
  registerStudent,
  verifyStudentEmail,
  loginStudent,
  getAllStudents,
  resetPassword,
  forgotPassword,
  resendEmailVerification,
  getStudentsBySearch,
};
