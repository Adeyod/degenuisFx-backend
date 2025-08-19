import mongoose from 'mongoose';
import { RefreshToken } from '../model/refreshToken.js';

const getUserRefreshTokenDetails = async (userId) => {
  console.log('userId', typeof userId);
  console.log('userId', userId);
  const objectId = new mongoose.Types.ObjectId(userId);

  const findToken = await RefreshToken.findOne({ userId: objectId });
  console.log('findToken', findToken);

  return findToken;
};

export { getUserRefreshTokenDetails };
