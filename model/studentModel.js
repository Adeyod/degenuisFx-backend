import mongoose from 'mongoose';
import { genderEnum, memberRole } from '../utils/enumModules.js';

const studentSchema = new mongoose.Schema({
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
  role: { type: String, enum: memberRole, default: memberRole[0] },
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
