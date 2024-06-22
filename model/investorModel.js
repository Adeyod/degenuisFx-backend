import mongoose from 'mongoose';
import { genderEnum, memberRole } from '../utils/enumModules.js';

const investorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  gender: { type: String, enum: genderEnum },
  DOB: { type: Date },
  phoneNumber: { type: String }, // how are you going to be sending this to me
  countryOfResidence: { type: String },
  stateOfResidence: { type: String },
  address: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: memberRole, default: memberRole[1] },

  // added for updating investors
  nokName: { type: String },
  nokRelationship: { type: String },
  nokAddress: { type: String },
  nokPhoneNumber: { type: String },
  annualIncomeCurrency: { type: String },
  annualIncome: { type: Number },
  netWorthCurrency: { type: String },
  netWorth: { type: Number },
  sourceOfIncome: { type: String },
  // bankName: { type: String },
  // accountNumber: { type: String },
  // accountName: { type: String },
  // walletAddress: { type: String },
});

const Investor = mongoose.model('Investor', investorSchema);
export default Investor;
