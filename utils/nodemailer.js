import nodemailer from 'nodemailer';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
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

const emailVerificationTemplate = readFileSync(
  join(__dirname, 'htmlTemplates', 'emailVerification.html'),
  'utf-8'
);

const passwordResetTemplate = readFileSync(
  join(__dirname, 'htmlTemplates', 'passwordReset.html'),
  'utf8'
);
const paymentEnrollmentConfirmationTemplate = readFileSync(
  join(__dirname, 'htmlTemplates', 'paymentEnrollmentConfirmation.html'),
  'utf8'
);
const trainingCompletionCongratulationTemplate = readFileSync(
  join(__dirname, 'htmlTemplates', 'trainingCompletionCongratulations.html'),
  'utf8'
);

const emailVerification = async (email, firstName, link, next) => {
  try {
    const emailVerificationContent = emailVerificationTemplate
      .replace('{{verificationLink}}', link)
      .replace('{{fullName}}', firstName);

    const info = transporter.sendMail({
      text: `Welcome ${firstName}`,
      subject: 'Email verification',
      to: email,
      sender: process.env.USER,
      html: emailVerificationContent,
    });

    return info;
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
};

const forgotPasswordSender = async (email, link, firstName, next) => {
  try {
    const forgotPasswordContent = passwordResetTemplate
      .replace('{{resetLink}}', link)
      .replace('{{fullName}}', firstName);
    const info = await transporter.sendMail({
      text: `Welcome ${firstName}`,
      subject: 'Password reset link',
      to: email,
      sender: process.env.USER,
      html: forgotPasswordContent,
    });

    return info;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const paymentEnrollmentConfirmationMail = async (
  email,
  enrollmentDate,
  amountPaid,
  courseType,
  paymentStatus,
  nextPaymentDate,
  fullName
) => {
  try {
    console.log('paymentEnrollmentConfirmationMail:', email);
    console.log('paymentEnrollmentConfirmationMail:', enrollmentDate);
    console.log('paymentEnrollmentConfirmationMail:', amountPaid);
    console.log('paymentEnrollmentConfirmationMail:', courseType);
    console.log('paymentEnrollmentConfirmationMail:', paymentStatus);
    console.log('paymentEnrollmentConfirmationMail:', nextPaymentDate);
    console.log('paymentEnrollmentConfirmationMail:', fullName);
    const paymentEnrollmentConfirmationContent =
      paymentEnrollmentConfirmationTemplate
        .replace('{{enrollmentDate}}', enrollmentDate)
        .replace('{{nextPaymentDate}}', nextPaymentDate)
        .replace('{{paymentStatus}}', paymentStatus)
        .replace('{{amountPaid}}', amountPaid)
        .replace('{{courseType}}', courseType)
        .replace('{{fullName}}', fullName);
    const info = await transporter.sendMail({
      text: `Welcome ${firstName}`,
      subject: 'Payment Confirmation',
      to: email,
      sender: process.env.USER,
      html: paymentEnrollmentConfirmationContent,
    });

    return info;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const trainingCompletionCongratulationMail = async (studentName, email) => {
  try {
    const trainingCompletionCongratulationContent =
      trainingCompletionCongratulationTemplate.replace(
        '{{studentName}}',
        studentName
      );

    const info = await transporter.sendMail({
      text: `Welcome ${studentName}`,
      subject: 'Training Completion',
      to: email,
      sender: process.env.USER,
      html: trainingCompletionCongratulationContent,
    });

    return info;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export {
  trainingCompletionCongratulationMail,
  emailVerification,
  paymentEnrollmentConfirmationMail,
  forgotPasswordSender,
};
