import bcrypt from 'bcryptjs';
import { getUserRefreshTokenDetails } from '../repository/tokenRepository.js';
import { findUserById } from '../repository/userRepository.js';
import {
  generateAccessToken,
  jwtDecodeRefreshToken,
} from '../middleware/jwtAuth.js';

const requestAccessToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    console.log('refreshToken:', refreshToken);
    if (!refreshToken) {
      throw new AppError(`Please provide a refresh token.`, 400);
    }
    const decodeTokenResponse = await jwtDecodeRefreshToken(refreshToken);

    console.log('decodeTokenResponse:', decodeTokenResponse);
    const tokenResponse = await getUserRefreshTokenDetails(
      decodeTokenResponse.userId
    );

    if (!tokenResponse) {
      throw new AppError(`Token does not exist or token has expired.`, 404);
    }

    console.log('tokenResponse:', tokenResponse);

    const compareToken = await bcrypt.compare(
      refreshToken,
      tokenResponse.token
    );
    console.log('compareToken:', compareToken);

    if (!compareToken) {
      throw new AppError(`Invalid token.`, 404);
    }

    const user = await findUserById(tokenResponse.userId);
    console.log('user:', user);

    if (!user) {
      throw new AppError(`Invalid user.`, 404);
    }

    const newAccessToken = await generateAccessToken(
      user?._id,
      user?.email,
      user.role
    );
    console.log('newAccessToken:', newAccessToken);

    if (!newAccessToken) {
      throw new AppError(`Unable to generate a new access token.`, 400);
    }

    const { password: hashValue, ...others } = user.toObject();

    return res.status(200).json({
      message: 'Access token generated successfully',
      accessToken: newAccessToken,
      refreshToken: refreshToken,
      user: others,
      success: true,
      status: 200,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.message, error.statusCode);
    } else {
      console.error(error);
      throw new Error('Something went wrong');
    }
  }
};

export { requestAccessToken };
