import mongoose from 'mongoose';
import { preferedClassModeEnum } from '../utils/enumModules.js';

const classModeSchema = new mongoose.Schema(
  {
    title: { type: String, enum: preferedClassModeEnum, required: true },
    fee: { type: Number, required: true },
    // duration: { type: String },
  },
  { timestamps: true }
);

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: String },
    classModes: { type: [classModeSchema], required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Training = mongoose.model('Training', trainingSchema);

export default Training;
