import FeedBack from '../model/feedBackModel.js';
import ContactUs from '../model/contactUsModel.js';
import EmailSubscription from '../model/emailSubscriptionModel.js';
import { AppError } from '../utils/app.error.js';
import catchErrors from '../utils/tryCatch.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const feedBack = catchErrors(async (req, res) => {
  const { name, email, message, rating } = req.body;

  if (!name || !email || !rating) {
    throw new AppError('All fields are required', 400);
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (forbiddenCharsRegex.test(trimmedName)) {
    throw new AppError('Invalid input in the field name', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  if (message !== '') {
    if (forbiddenCharsRegex.test(trimmedMessage)) {
      throw new AppError('Invalid input for field message', 400);
    }
  }

  const newFeedBack = await new FeedBack({
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage ? trimmedMessage : '',
    rating,
  }).save();

  if (!newFeedBack) {
    throw new AppError('Unable to save feedback', 400);
  }

  return res.json({
    message: 'Thank you for the feedback',
    status: 200,
    success: true,
    sender: newFeedBack.name,
  });
});

const contactUs = catchErrors(async (req, res) => {
  const { name, email, phoneNumber, message, howToFindUs } = req.body;

  if (!name || !email || !message || !phoneNumber) {
    throw new AppError('All fields are required', 400);
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (forbiddenCharsRegex.test(trimmedName)) {
    throw new AppError('Invalid input in the field name', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  if (message !== '') {
    if (forbiddenCharsRegex.test(trimmedMessage)) {
      throw new AppError('Invalid input for field message', 400);
    }
  }

  const newContactUs = await new ContactUs({
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage,
    phoneNumber,
  }).save();

  if (!newContactUs) {
    throw new AppError('Unable to save contact us message', 400);
  }

  return res.json({
    message: 'Thank you for contacting us, we will soon get back to you',
    status: 200,
    success: true,
    sender: newContactUs.name,
  });
});

const emailSubscription = catchErrors(async (req, res) => {
  const { email } = req.body;

  const trimmedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Invalid input for email...', 400);
  }

  const emailExist = await EmailSubscription.findOne({
    email: trimmedEmail,
  });

  if (emailExist) {
    throw new AppError('Email already exist', 400);
  }

  const newEmailSubscription = await new EmailSubscription({
    email: trimmedEmail,
  }).save();

  if (!newEmailSubscription) {
    throw new AppError('Unable to save email', 400);
  }

  return res.json({
    message: 'Thank you for subscribing',
    status: 200,
    success: true,
  });
});

export { feedBack, emailSubscription, contactUs };
