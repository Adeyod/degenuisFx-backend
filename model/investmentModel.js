import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    amountToInvest: { type: Number, required: true },
    adminChargePercent: { type: Number, required: true },
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    duration: { type: String, required: true },
    isApprovedForInvestment: { type: Boolean, default: false },
    isAdminChargesPaid: { type: Boolean, default: false },
    adminChargeFee: { type: Number, required: true },
  },
  { timestamps: true }
);

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;
