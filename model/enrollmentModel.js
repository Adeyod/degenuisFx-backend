import mongoose from 'mongoose';
import {
  enrollmentPaymentStatus,
  enrollmentStatus,
  paymentModeEnum,
  preferedClassModeEnum,
} from '../utils/enumModules.js';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
    preferedClassMode: {
      type: String,
      enum: preferedClassModeEnum,
      required: true,
    },
    paymentMode: { type: String, enum: paymentModeEnum, required: true },
    status: {
      type: String,
      enum: enrollmentStatus,
      default: enrollmentStatus[0],
    },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
