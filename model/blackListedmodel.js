import mongoose from 'mongoose';

const blackListedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expires_at: { type: Date, required: true },
});

blackListedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const BlackListedToken = mongoose.model(
  'BlackListedToken',
  blackListedTokenSchema
);

export default BlackListedToken;
