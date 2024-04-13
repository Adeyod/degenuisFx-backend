import mongoose from 'mongoose';

const feedBackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 1 },
  },
  { timestamps: true }
);

const FeedBack = mongoose.model('FeedBack', feedBackSchema);
export default FeedBack;
