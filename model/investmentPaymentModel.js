import mongoose from 'mongoose';
import {
  transactionStatusEnum,
  transactionTypeEnum,
} from '../utils/enumModules.js';

const investmentPaymentSchema = new mongoose.Schema(
  {
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },

    payment: {
      paymentDate: { type: Date, default: Date.now },
      amountPaid: { type: Number, required: true },
      nairaValue: { type: Number, required: true },
      transactionType: {
        type: String,
        enum: transactionTypeEnum[0],
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
  },
  { timestamps: true }
);

const InvestmentPayment = mongoose.model(
  'InvestmentPayment',
  investmentPaymentSchema
);
export default InvestmentPayment;
