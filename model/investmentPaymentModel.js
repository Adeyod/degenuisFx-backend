import mongoose from 'mongoose';
import {
  investmentTransactionTypeEnum,
  transactionStatusEnum,
} from '../utils/enumModules.js';

const investmentPaymentSchema = new mongoose.Schema(
  {
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },

    paymentDate: { type: Date },
    amountPaid: { type: Number, required: true },
    nairaValue: { type: Number, required: true },
    investmentTransactionType: {
      type: String,
      enum: investmentTransactionTypeEnum[0],
      required: true,
    },
    transactionStatus: {
      type: String,
      enum: transactionStatusEnum,
      default: transactionStatusEnum[0], // e.g., "PENDING"
    },
    description: { type: String },
    reference: { type: String, unique: true },
    companyPaymentReference: { type: String },
    authorizationUrl: { type: String },
  },
  { timestamps: true }
);

const InvestmentPayment = mongoose.model(
  'InvestmentPayment',
  investmentPaymentSchema
);
export default InvestmentPayment;
