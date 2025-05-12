// backend/email/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_RECEIVER = process.env.EMAIL_RECEIVER || 'kesarwanimohit@yahoo.com';

const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendEmail(signalType, bitcoinPrice, summary) {
  const now = new Date();
  const aestTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_RECEIVER,
    subject: `Crypto Signal: ${signalType}`,
    html: `
      <p><strong>Signal Type:</strong> ${signalType}</p>
      <p><strong>Date/Time (AEST):</strong> ${aestTime.toLocaleString()}</p>
      <p><strong>Current Bitcoin Price:</strong> $${bitcoinPrice}</p>
      <p><strong>Summary:</strong> ${summary}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };

// backend/utils/rateLimiter.js
const moment = require('moment');

const lastSent = {};
const defaultRateLimitHours = 4;

function shouldSendEmail(signalType, rateLimitHours = defaultRateLimitHours) {
  const now = moment();
  const lastSentTime = lastSent[signalType];

  if (!lastSentTime) {
    lastSent[signalType] = now;
    return true;
  }

  const duration = moment.duration(now.diff(lastSentTime));
  const hours = duration.asHours();

  if (hours >= rateLimitHours) {
    lastSent[signalType] = now;
    return true;
  }

  return false;
}

module.exports = { shouldSendEmail };

// backend/routes/index.js
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../email/emailService');
const { shouldSendEmail } = require('../utils/rateLimiter');

// Example route to trigger an email notification
router.post('/signal', async (req, res) => {
  const { signalType, bitcoinPrice, summary } = req.body;

  if (!['Strong Buy', 'Strong Sell'].includes(signalType)) {
    return res.status(400).json({ error: 'Invalid signal type' });
  }

  if (shouldSendEmail(signalType)) {
    await sendEmail(signalType, bitcoinPrice, summary);
    return res.status(200).json({ message: 'Email sent!' });
  } else {
    return res.status(200).json({ message: 'Email rate limited' });
  }
});

module.exports = router;

// Example Usage (in your main app.js or server.js):
// const express = require('express');
// const routes = require('./backend/routes');
// const app = express();
// app.use(express.json());
// app.use('/', routes);

// To test:
// 1. Make sure you have a .env file with EMAIL_USER, EMAIL_PASS, and GITHUB_TOKEN
// 2. Run the server (e.g., node app.js)
// 3. Send a POST request to /signal with the following JSON body:
//    {
//      "signalType": "Strong Buy",
//      "bitcoinPrice": 65000,
//      "summary": "RSI is oversold and MACD is crossing over."
//    }
