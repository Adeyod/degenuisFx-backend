import mongoose from 'mongoose';
import { genderEnum, memberRole } from '../utils/enumModules.js';

const investorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  gender: { type: String, enum: genderEnum },
  DOB: { type: Date },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isUpdated: { type: Boolean, default: false },
  role: { type: String, enum: memberRole, default: memberRole[1] },

  phoneNumber: { type: String }, // how are you going to be sending this to me
  address: { type: String },
  countryOfResidence: { type: String },
  stateOfResidence: { type: String },

  // added for updating investors
  nokAddress: { type: String },
  nokName: { type: String },
  nokPhoneNumber: { type: String },
  nokRelationship: { type: String },

  annualIncomeCurrency: { type: String },
  annualIncome: { type: Number },
  netWorthCurrency: { type: String },
  netWorth: { type: Number },
  sourceOfIncome: { type: String },
  // bankName: { type: String },
  // accountNumber: { type: String },
  // accountName: { type: String },
  // walletAddress: { type: String },

  /**
   * users should not be able to go to any page if they have not updated their account
   stateOfResidence, 
   nokAddress,
   nokName, 
   countryOfResidence, 
   address, 
   nokPhoneNumber, 
   nokRelationship, 
   phoneNumber, 
   * 
 

   */
});

const Investor = mongoose.model('Investor', investorSchema);
export default Investor;
