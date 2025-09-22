import nodemailer from 'nodemailer';
import path, { dirname, join } from 'path';
import { readFileSync } from 'fs';
import fs from 'fs';
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
const balancePaymentReminderTemplate = readFileSync(
  join(__dirname, 'htmlTemplates', 'balancePaymentReminder.html'),
  'utf8'
);

const emailVerification = async (email, firstName, link) => {
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

const forgotPasswordSender = async (email, link, firstName) => {
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

const paymentEnrollmentConfirmationMail = async ({
  email,
  enrollmentDate,
  amountPaid,
  courseType,
  paymentStatus,
  nextPaymentDate,
  fullName,
}) => {
  try {
    console.log('nextPaymentDate:', nextPaymentDate);
    const paymentEnrollmentConfirmationContent =
      paymentEnrollmentConfirmationTemplate
        .replace('{{enrollmentDate}}', enrollmentDate)
        .replace('{{nextPaymentDate}}', nextPaymentDate)
        .replace('{{paymentStatus}}', paymentStatus)
        .replace('{{amountPaid}}', amountPaid)
        .replace('{{courseType}}', courseType)
        .replace('{{fullName}}', fullName)
        .replace('{fullName}', fullName);

    const info = await transporter.sendMail({
      text: `Welcome ${fullName}`,
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

const trainingCompletionCongratulationMail = async ({ studentName, email }) => {
  try {
    console.log('studentName:', studentName);
    console.log('email:', email);
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

const balancePaymentReminder = async ({
  fullName,
  amountPaid,
  courseType,
  dueDate,
  balanceAmount,
  totalFee,
  paymentDate,
  email,
}) => {
  try {
    console.log('fullName:', fullName);
    console.log('email:', email);
    const balancePaymentReminderContent = balancePaymentReminderTemplate
      .replace('{{fullName}}', fullName)
      .replace('{fullName}', fullName)
      .replace('{{courseType}}', courseType)
      .replace('{{dueDate}}', dueDate)
      .replace('{{balanceAmount}}', balanceAmount)
      .replace('{{totalFee}}', totalFee)
      .replace('{{paymentDate}}', paymentDate)
      .replace('{{amountPaid}}', amountPaid)
      .replace('{amountPaid}', amountPaid);

    const info = await transporter.sendMail({
      text: `Welcome ${fullName}`,
      subject: 'Balance Payment Reminder',
      to: email,
      sender: process.env.USER,
      html: balancePaymentReminderContent,
    });

    return info;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export {
  balancePaymentReminder,
  trainingCompletionCongratulationMail,
  emailVerification,
  paymentEnrollmentConfirmationMail,
  forgotPasswordSender,
};
