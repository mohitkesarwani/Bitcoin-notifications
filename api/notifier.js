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
  console.log(`[EMAIL][${subject}] Email trigger received`);

  if (process.env.ENABLE_NOTIFICATIONS !== 'true') {
    console.log(`[EMAIL][${subject}] Notifications disabled - email not sent`);
    return;
  }

  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.ALERT_EMAIL || process.env.NOTIFICATION_EMAIL;
  if (!emailFrom || !emailTo) {
    console.warn(`[EMAIL][${subject}] EMAIL_FROM or ALERT_EMAIL not set. Skipping email.`);
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`[EMAIL][${subject}] Transporter could not be created - check SENDGRID_API_KEY`);
    return;
  }

  const prefix = process.env.EMAIL_SUBJECT_PREFIX || '';
  const fullSubject = prefix ? `${prefix} ${subject}` : subject;

  console.log(`[EMAIL][${subject}] Sending email to ${emailTo}`);
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
