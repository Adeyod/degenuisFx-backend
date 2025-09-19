import mongoose, { Schema } from 'mongoose';

const studentTokenSchema = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    token: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800,
    },
  },
  { timestamps: true }
);

const investorTokenSchema = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'investor', required: true },
    token: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800,
    },
  },
  { timestamps: true }
);

const StudentToken = mongoose.model('StudentToken', studentTokenSchema);
const InvestorToken = mongoose.model('InvestorToken', investorTokenSchema);

export { InvestorToken, StudentToken };
