// index.js
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Example scheduled task (disabled by default, enable via EMAIL_ENABLED)
async function sendEmail() {
  try {
    // Configuration moved to try block
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: process.env.EMAIL_ADDRESS,
      subject: 'Scheduled Task Notification',
      text: 'This email was sent by a scheduled task.',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

if (process.env.EMAIL_ENABLED === 'true') {
  cron.schedule('0 9 * * *', () => {
    // Runs at 9:00 AM every day
    sendEmail();
  });
  console.log('Email scheduling enabled.');
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
