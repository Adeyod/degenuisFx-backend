import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    phoneNumber: { type: String },
    // howToFindUs: { type: String, required: true },
  },
  { timestamps: true }
);

const ContactUs = mongoose.model('ContactUs', contactSchema);
export default ContactUs;
