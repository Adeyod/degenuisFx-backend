import Student from '../model/studentModel.js';
import {
  emailVerification,
  forgotPasswordSender,
} from '../utils/nodemailer.js';
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
        role,
      }).save();

      const newToken = await new StudentToken({
        userId: newStudent._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

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
        role,
        address: trimmedAddress,
        phoneNumber,
      }).save();

      const newToken = await new StudentToken({
        userId: newStudent._id,
        token,
      }).save();

      // const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

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
        const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${isValidToken.userId}&token=${isValidToken.token}`;

        await emailVerification(isStudent.email, isStudent.firstName, link);

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

      const newToken = await new StudentToken({
        userId: isStudent._id,
        token,
      }).save();

      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

      await emailVerification(isStudent.email, isStudent.firstName, link);

      return res.json({
        message:
          'Please use the mail sent to your email address to verify your email',
        success: false,
        status: 400,
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
        message: `${others.role} login successfully`,
        success: true,
        status: 200,
        user: others,
        token: jwtSign,
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

const updateStudent = async (req, res) => {
  try {
    const {
      nokName,
      nokRelationship,
      nokAddress,
      nokPhoneNumber,
      highestEducationAttained,
      levelOfForexExperience,
      legalKnowledgeAndAcceptance,

      phoneNumber,
      countryOfResidence,
      stateOfResidence,
      address,
      // risk appetite,
      // infoSource,
      // referralName,
      // questionsAndComments,
      // acknowledgment,
    } = req.body;

    if (
      !nokName ||
      !nokRelationship ||
      !nokAddress ||
      !nokPhoneNumber ||
      !highestEducationAttained ||
      !levelOfForexExperience ||
      !legalKnowledgeAndAcceptance
      // !infoSource ||
      // !referralName ||
      // !questionsAndComments ||
      // !acknowledgment
    ) {
      return res.json({
        error: 'All fields are required...',
        status: 400,
        success: false,
      });
    }

    const trimmedNokName = nokName.trim();
    const trimmedNokRelationship = nokRelationship.trim();
    const trimmedNokAddress = nokAddress.trim();

    if (forbiddenCharsRegex.test(trimmedNokName)) {
      return res.json({
        error: 'Invalid character at next-of-kin field',
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

    if (forbiddenCharsRegex.test(trimmedNokAddress)) {
      return res.json({
        error: 'Invalid character at next-of-kin address field',
        success: false,
        status: 400,
      });
    }

    const user = req.user.userId;

    const { studentId } = req.params;

    if (user !== studentId) {
      return res.json({
        error: 'Not the authorized user',
      });
    }

    const findAndUpdateStudent = await Student.findByIdAndUpdate(
      {
        _id: studentId,
      },
      {
        nokName: trimmedNokName,
        nokRelationship: trimmedNokRelationship,
        nokAddress: trimmedNokAddress,
        nokPhoneNumber,
        highestEducationAttained,
        levelOfForexExperience,
        legalKnowledgeAndAcceptance,
        // infoSource,
        // referralName,
        // questionsAndComments,
      },
      {
        new: true,
      }
    );

    if (!findAndUpdateStudent) {
      return res.json({
        error: 'unable to update student',
        status: 404,
        success: false,
      });
    }

    const { password, ...others } = findAndUpdateStudent._doc;

    return res.json({
      message: `${others.role} updated successfully`,
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

const studentLogout = async (req, res) => {
  try {
    const userLogout = await res.cookie('token', '', { maxAge: 1 });
    if (!userLogout) {
      return res.json({
        error: 'unable to log out',
        success: false,
        status: 400,
      });
    } else {
      return res.json({
        message: 'User logged out successfully',
        success: true,
        status: 200,
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

const forgotPassword = async (req, res) => {
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

    const findUser = await Student.findOne({ email });
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
    return res.json({
      error: error.message,
      message: 'Something happened',
      success: false,
      status: 500,
    });
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

    const findToken = await StudentToken.findOne({
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

    const findUser = await Student.findById({
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

const resendEmailVerification = async (req, res) => {
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

    const findUser = await Student.findOne({ email: trimmedEmail });

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

    const checkTokenExist = await StudentToken.findOne({
      userId: findUser._id,
    });

    if (checkTokenExist) {
      // const link = `${process.env.FRONTEND_URL}/student/verify-email/${checkTokenExist.userId}/${checkTokenExist.token}`;

      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${checkTokenExist.userId}&token=${checkTokenExist.token}`;

      await emailVerification(findUser.email, findUser.firstName, link);

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

      const newToken = await new StudentToken({
        token,
        userId: findUser._id,
      }).save();

      // const link = `${process.env.FRONTEND_URL}/student/verify-email/${newToken.userId}/${newToken.token}`;

      const link = `${process.env.FRONTEND_URL}/student/verify-email/?userId=${newToken.userId}&token=${newToken.token}`;

      await emailVerification(findUser.email, findUser.firstName, link);

      return res.json({
        message:
          'Email verification link sent successfully. Please verify your email with the link sent to you',
        success: true,
        status: 200,
      });
    }
  } catch (error) {
    return res.json({
      error: error.message,
      message: 'Something happened',
      success: false,
      status: 500,
    });
  }
};

// admin
const getSingleStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

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

const getAllStudents = async (req, res) => {
  try {
    const { page, limit } = req.query;

    let pages;
    let students;
    let count;

    if (!page) {
      students = await Student.find({
        role: 'student',
      }).select('-password');
      count = students.length;
      pages = 1;
    } else {
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;

      // Calculate skip value for pagination
      const skip = (pageNumber - 1) * pageSize;

      // Find the count of total documents
      count = await Student.countDocuments({ role: 'student' });

      pages = Math.ceil(count / pageSize);

      if (pageNumber > pages) {
        return res.json({
          error: 'Page limit exceeded',
          status: 404,
          success: false,
        });
      }

      // Query for fetching students with pagination
      students = await Student.find({ role: 'student' })
        .select('-password')
        .skip(skip)
        .limit(pageSize);

      // if no students found, return an appropriate message
      if (!students.length) {
        return res.json({
          error: 'No students found',
          success: false,
          status: 404,
        });
      }
    }

    // Return fetched students along with pagination info
    return res.json({
      message: 'Students found successfully',
      success: true,
      status: 200,
      students,
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

const getStudentsBySearch = async (req, res) => {
  try {
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
      return res.json({
        error: 'No matching students found',
        status: 404,
        success: false,
      });
    }

    return res.json({
      count: students.length,
      message: 'Searches found',
      status: 200,
      success: true,
      students,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

const subscribeToCourse = async (req, res) => {
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
