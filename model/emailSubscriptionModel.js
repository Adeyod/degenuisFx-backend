import mongoose from 'mongoose';

const emailSubscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
  },
  { timestamps: true }
);

const EmailSubScription = mongoose.model(
  'EmailSubscription',
  emailSubscriptionSchema
);

export default EmailSubScription;
