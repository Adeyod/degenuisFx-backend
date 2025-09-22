import mongoose from 'mongoose';
import {
  paymentStatus,
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
    enrollmentStatus: {
      type: String,
      enum: enrollmentStatus,
      default: enrollmentStatus[0],
    },
    endDate: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
