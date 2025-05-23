import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

function createTransporter() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[NOTIFY] SENDGRID_API_KEY is not configured. Emails disabled.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
}

async function sendEmail(subject, text) {
  if (process.env.ENABLE_NOTIFICATIONS !== 'true') return;

  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.ALERT_EMAIL || process.env.NOTIFICATION_EMAIL;
  if (!emailFrom || !emailTo) {
    console.warn('[NOTIFY] EMAIL_FROM or ALERT_EMAIL not set. Skipping email.');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) return;

  const prefix = process.env.EMAIL_SUBJECT_PREFIX || '';
  const fullSubject = prefix ? `${prefix} ${subject}` : subject;

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: emailTo,
      subject: fullSubject,
      text
    });
    console.log(`[EMAIL][${subject}] Email sent successfully`);
    console.log(`  From: ${process.env.EMAIL_FROM}`);
    console.log(`  To: ${process.env.ALERT_EMAIL}`);
    console.log(`  Body:\n${text}`);
  } catch (err) {
    console.error(`[EMAIL ERROR][${subject}] Failed to send to ${process.env.ALERT_EMAIL}`);
    console.error(err);
  }
}

export { sendEmail };
