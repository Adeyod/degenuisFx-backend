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
      return res.status(404).json({
        error: `Please provide a refresh token.`,
        status: 404,
        success: false,
      });
    }
    const decodeTokenResponse = await jwtDecodeRefreshToken(refreshToken);

    console.log('decodeTokenResponse:', decodeTokenResponse);
    const tokenResponse = await getUserRefreshTokenDetails(
      decodeTokenResponse.userId
    );

    if (!tokenResponse) {
      return res.status(404).json({
        error: `Token does not exist or token has expired.`,
        status: 404,
        success: false,
      });
    }

    console.log('tokenResponse:', tokenResponse);

    const compareToken = await bcrypt.compare(
      refreshToken,
      tokenResponse.token
    );
    console.log('compareToken:', compareToken);

    if (!compareToken) {
      return res.status(404).json({
        error: `Invalid token.`,
        status: 404,
        success: false,
      });
    }

    const user = await findUserById(tokenResponse.userId);
    console.log('user:', user);

    if (!user) {
      return res.status(404).json({
        error: `Invalid user.`,
        status: 404,
        success: false,
      });
    }

    const newAccessToken = await generateAccessToken(
      user?._id,
      user?.email,
      user.role
    );
    console.log('newAccessToken:', newAccessToken);

    if (!newAccessToken) {
      return res.status(400).json({
        error: ` Unable to generate a new access token.`,
        status: 400,
        success: false,
      });
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
    return res.json({
      message: 'Something happened',
      error: error.message,
      status: 500,
      success: false,
    });
  }
};

export { requestAccessToken };
