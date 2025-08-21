import mongoose from 'mongoose';
import {
  paymentModeEnum,
  preferedClassModeEnum,
  transactionStatusEnum,
} from '../utils/enumModules.js';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    dueDate: { type: Date },
    trainingFee: { type: Number, required: true },
    paymentSummary: [
      {
        paymentDate: { type: Date, default: Date.now },
        amountPaid: { type: Number },
        balance: { type: Number },
        transactionType: { type: String },
        transactionStatus: {
          type: String,
          enum: transactionStatusEnum,
          default: transactionStatusEnum[0],
        },
        description: { type: String },
        reference: { type: String },
        companyPaymentReference: { type: String },
        authorizationUrl: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
