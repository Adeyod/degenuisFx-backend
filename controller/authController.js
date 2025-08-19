import { getUserRefreshTokenDetails } from '../repository/tokenRepository.js';
import { findUserById } from '../repository/userRepository.js';
import { generateAccessToken } from '../utils/jwtAuth.js';

const requestAccessToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(404).json({
        error: `Please provide a refresh token.`,
        status: 404,
        success: false,
      });
    }
    const decodeTokenResponse = await jwtDecodeRefreshToken(token);

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

    const compareToken = await bcrypt.compare(token, tokenResponse.token);

    if (!compareToken) {
      return res.status(404).json({
        error: `Invalid token.`,
        status: 404,
        success: false,
      });
    }

    const user = await findUserById(tokenResponse.userId);

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

    const confirmTokenResponse = {
      user,
      newAccessToken,
      refreshToken: token,
    };

    if (!confirmTokenResponse) {
      return res.status(400).json({
        error: ` Unable to generate a new access token.`,
        status: 400,
        success: false,
      });
    }

    const { password: hashValue, ...others } =
      confirmTokenResponse.user.toObject();

    return res.status(200).json({
      message: 'Access token generated successfully',
      accessToken: confirmTokenResponse.newAccessToken,
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
