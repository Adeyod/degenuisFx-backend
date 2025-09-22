import mongoose from 'mongoose';
import {
  paymentModeEnum,
  paymentStatus,
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
    isPaymentReminderSent: { type: Boolean, default: false },
    dueDate: { type: Date },
    trainingFee: { type: Number, required: true },
    balance: { type: Number },
    currentPayment: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: paymentStatus,
      default: paymentStatus[0],
    },
    paymentSummary: [
      {
        paymentDate: { type: Date, default: Date.now },
        amountPaid: { type: Number },
        nairaValue: { type: Number },
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
