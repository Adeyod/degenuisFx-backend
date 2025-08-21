// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';

// const generateToken = async (res, user) => {
//   try {
//     const payload = {
//       userId: user._id,
//       userRole: user.role,
//       email: user.email,
//     };

//     const payload2 = {
//       userId: user._id,
//       userRole: user.role,
//       unique: uuidv4(),
//     };

//     const token = jwt.sign(payload, process.env.JWT_SECRET, {
//       expiresIn: '15d',
//     });

//     const frontToken = jwt.sign(payload2, process.env.JWT_SECRET, {
//       expiresIn: '15d',
//     });

//     res.cookie('token', token, {
//       httpOnly: true,
//       sameSite: 'None',
//       // sameSite: 'Lax',
//       // sameSite: 'strict',
//       maxAge: 15 * 24 * 60 * 60 * 1000,
//       // secure: false, // Include this if your app is served over HTTP
//       secure: true, // Include this if your app is served over HTTPS
//     });

//     return frontToken;
//   } catch (error) {
//     console.log(error.message);
//     return;
//   }
// };

// const verifyToken = async (req, res, next) => {
//   try {
//     const token = req.cookies.token;

//     if (!token) {
//       return res.json({
//         message: 'Please login to continue',
//         status: 403,
//         success: false,
//       });
//     }

//     await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.json({
//           message: 'Invalid token',
//           success: false,
//           status: 401,
//           error: err.message,
//         });
//       }

//       req.user = user;

//       next();
//     });
//   } catch (error) {
//     console.log(error.message);
//     return;
//   }
// };

// export { generateToken, verifyToken };

import jwt from 'jsonwebtoken';

const jwtAccessSecret = process.env.JWT_ACCESS_TOKEN;
const jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN;

const generateAccessToken = async (userId, userEmail, userRole) => {
  try {
    const payload = {
      userId,
      userEmail,
      userRole,
    };

    if (!jwtAccessSecret) {
      throw new Error(
        `JWT_SECRET is not defined in the environment variables.`,
        404
      );
    }

    const accessToken = await jwt.sign(payload, jwtAccessSecret, {
      expiresIn: '2days',
    });

    return accessToken;
  } catch (error) {
    throw new Error(error.message, error.status);
  }
};

const generateRefreshToken = async (userId, userEmail, userRole) => {
  try {
    const payload = {
      userId,
      userEmail,
      userRole,
    };

    if (!jwtRefreshSecret) {
      throw new Error(
        `JWT_SECRET is not defined in the environment variables.`,
        404
      );
    }

    const refreshToken = await jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: '7days',
    });

    return refreshToken;
  } catch (error) {
    throw new Error(error.message, error.status);
  }
};

const verifyAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.headers['authorization']?.split(' ')[1];

    console.log('1');
    console.log(accessToken);

    if (!accessToken) {
      return res.status(401).json({
        error: `Please login to continue.`,
        status: 401,
        success: false,
      });
    }

    if (!jwtAccessSecret) {
      return res.status(404).json({
        error: `JWT_SECRET is not defined in the environment variables.`,
        status: 404,
        success: false,
      });
    }

    const user = await jwt.verify(accessToken, jwtAccessSecret);

    if (!user) {
      return res.status(400).json({
        error: `Invalid token.`,
        status: 400,
        success: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(new Error(error.message, error.status));
  }
};

const jwtDecodeRefreshToken = async (token) => {
  try {
    if (!token) {
      throw new Error(`Please provide a token to continue.`, 404);
    }

    if (!jwtRefreshSecret) {
      throw new Error(
        `JWT_SECRET is not defined in the environment variables.`,
        404
      );
    }

    console.log('jwtRefreshSecret:', jwtRefreshSecret);
    const response = await jwt.verify(token, jwtRefreshSecret);

    console.log('response:', response);

    if (
      !response ||
      typeof response !== 'object' ||
      !('userId' in response) ||
      !('userEmail' in response) ||
      !('userRole' in response)
    ) {
      throw new Error(`could not verify token.`, 400);
    }

    return response;
  } catch (error) {
    console.error(error);
    // throw new Error('Invalid or expired token');
    return;
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  jwtDecodeRefreshToken,
};
