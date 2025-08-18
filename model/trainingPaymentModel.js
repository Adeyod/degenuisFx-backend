import mongoose from 'mongoose';
import {
  paymentModeEnum,
  preferedClassModeEnum,
} from '../utils/enumModules.js';

const trainingPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    preferedClassMode: {
      type: String,
      required: true,
      enum: {
        values: preferedClassModeEnum,
        message: `{VALUE} is not a valid preferred class mode.`,
      },
    },
    paymentMode: {
      type: String,
      required: true,
      enum: {
        values: paymentModeEnum,
        message: `{VALUE} is not a valid payment mode.`,
      },
    },
    trainingFee: { type: Number, required: true },
    paymentSummary: [
      {
        amountPaid: { type: Number },
        balance: { type: Number },
        transactionType: { type: String },
        transactionStatus: { type: String },
        description: { type: String },
        reference: { type: String },
        authorizationUrl: { type: String },
      },
    ],
    balance: { type: Number },
    nextPaymentDate: { type: Date },
  },
  { timestamps: true }
);

const TrainingPayment = mongoose.model(
  'TrainingPayment',
  trainingPaymentSchema
);
export default TrainingPayment;
