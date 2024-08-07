import nodemailer from 'nodemailer';
import { dirname, join } from 'path';
import { readFile, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
  secure: process.env.SECURE,
  tls: { rejectUnauthorized: false },
});

const emailVerificationTemplatePath = join(
  __dirname,
  'htmlTemplates',
  'emailVerification.html'
);

const emailVerificationTemplate = readFileSync(
  emailVerificationTemplatePath,
  'utf-8'
);

const passwordResetTemplatePath = join(
  __dirname,
  'htmlTemplates',
  'passwordReset.html'
);

const passwordResetTemplate = readFileSync(passwordResetTemplatePath, 'utf8');

const emailVerification = async (email, firstName, link, next) => {
  try {
    const emailVerificationContent = emailVerificationTemplate
      .replace('{{link}}', link)
      .replace('{firstName}', firstName);

    const info = transporter.sendMail({
      text: `Welcome ${firstName}`,
      subject: 'Email verification',
      to: email,
      sender: process.env.USER,
      html: `Click this link ${link} to verify your email`,
    });

    console.log('Email sent:', info.messageId);

    return info;
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const forgotPasswordSender = async (email, link, firstName, next) => {
  try {
    const forgotPasswordContent = passwordResetTemplate
      .replace('{{link}}', link)
      .replace('{{firstName}}', firstName);
    const info = await transporter.sendMail({
      text: `Welcome ${firstName}`,
      subject: 'Password reset link',
      to: email,
      sender: process.env.USER,
      html: `Click this link ${link} to reset your password`,
    });

    console.log('reset password sent:', info.messageId);
    return info;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export { emailVerification, forgotPasswordSender };
