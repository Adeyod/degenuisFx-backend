import FeedBack from '../model/feedBackModel.js';
import EmailSubScription from '../model/emailSubscriptionModel.js';
import ContactUs from '../model/contactUsModel.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const feedBack = async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    if (!name || !email || !rating) {
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (forbiddenCharsRegex.test(trimmedName)) {
      return res.json({
        error: 'Invalid input in the field name',
        status: 400,
        success: false,
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    if (message !== '') {
      if (forbiddenCharsRegex.test(trimmedMessage)) {
        return res.json({
          error: 'Invalid input for field message',
          success: false,
          status: 400,
        });
      }
    }

    const newFeedBack = await new FeedBack({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage ? trimmedMessage : '',
      rating,
    }).save();

    if (!newFeedBack) {
      return res.json({
        error: 'Unable to save feedback',
      });
    }

    return res.json({
      message: 'Thank you for the feedback',
      status: 200,
      success: true,
      sender: newFeedBack.name,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const contactUs = async (req, res) => {
  try {
    const { name, email, phoneNumber, message, howToFindUs } = req.body;

    if (!name || !email || !message || !phoneNumber) {
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (forbiddenCharsRegex.test(trimmedName)) {
      return res.json({
        error: 'Invalid input in the field name',
        status: 400,
        success: false,
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    if (message !== '') {
      if (forbiddenCharsRegex.test(trimmedMessage)) {
        return res.json({
          error: 'Invalid input for field message',
          success: false,
          status: 400,
        });
      }
    }

    const newContactUs = await new ContactUs({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      phoneNumber,
    }).save();

    if (!newContactUs) {
      return res.json({
        error: 'Unable to save contact us message',
      });
    }

    return res.json({
      message: 'Thank you for contacting us, we will soon get back to you',
      status: 200,
      success: true,
      sender: newContactUs.name,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

const emailSubscription = async (req, res) => {
  try {
    const { email } = req.body;

    const trimmedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        error: 'Invalid input for email...',
        status: 400,
        success: false,
      });
    }

    const emailExist = await EmailSubScription({
      email: trimmedEmail,
    });

    if (emailExist) {
      return res.json({
        error: 'Email already exist',
        status: 400,
        success: false,
      });
    }

    const newEmailSubscription = await new EmailSubScription({
      email: trimmedEmail,
    }).save();

    if (!newEmailSubscription) {
      return res.json({
        error: 'Unable to save email',
      });
    }

    return res.json({
      message: 'Thank you for subscribing',
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
      error: error.message,
    });
  }
};

export { feedBack, emailSubscription, contactUs };
