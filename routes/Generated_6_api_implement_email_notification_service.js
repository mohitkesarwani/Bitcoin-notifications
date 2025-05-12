// backend/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let lastSent = {
  'Strong Buy': null,
  'Strong Sell': null,
};
const THROTTLE_TIME = 4 * 60 * 60 * 1000; // 4 hours

async function sendEmail(signalType, bitcoinPrice, summary) {
  const now = new Date();
  const nowAEST = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));

  if (lastSent[signalType] && now - lastSent[signalType] < THROTTLE_TIME) {
    console.log(`Throttled email for ${signalType}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: `Bitcoin Signal: ${signalType}`,
    html: `
      <h1>Bitcoin Signal Alert</h1>
      <p><strong>Signal Type:</strong> ${signalType}</p>
      <p><strong>Date/Time (AEST):</strong> ${nowAEST.toLocaleString()}</p>
      <p><strong>Current Bitcoin Price:</strong> $${bitcoinPrice}</p>
      <p><strong>Summary:</strong> ${summary}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent for ${signalType}`);
    lastSent[signalType] = now;
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };

// backend/routes/index.js
const express = require('express');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

router.get('/test-email', async (req, res) => {
  try {
    await sendEmail('Strong Buy', 65000, 'MACD crossover and RSI above 70.');
    res.send('Test email sent!');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error sending test email');
  }
});

module.exports = router;
