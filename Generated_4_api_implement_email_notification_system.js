```javascript
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { loadContextFor } = require('../context/contextLoader');

// Rate limiting variables
const MAX_NOTIFICATIONS_PER_MINUTE = 5; // Configurable rate limit
let notificationCounts = {};

// Nodemailer configuration (replace with your actual credentials)
const transporter = nodemailer.createTransport({
  service: 'yahoo', // or your email service
  auth: {
    user: 'your_email@yahoo.com', // replace with your email
    pass: 'your_password' // replace with your password or app password
  }
});

// Function to check rate limit
function isRateLimited(signalType) {
  const now = Date.now();
  const key = `${signalType}_${Math.floor(now / 60000)}`; // Minute-based key

  if (!notificationCounts[key]) {
    notificationCounts[key] = 0;
  }

  if (notificationCounts[key] >= MAX_NOTIFICATIONS_PER_MINUTE) {
    return true; // Rate limited
  }

  notificationCounts[key]++;
  return false; // Not rate limited
}


// Function to send email notification
async function sendEmailNotification(signalType, timestamp, currentPrice, indicatorSummary) {
  if (isRateLimited(signalType)) {
    console.log(`⚠️ Rate limited: ${signalType} notification.`);
    return false; // Indicate that sending failed due to rate limit
  }

  const mailOptions = {
    from: 'your_email@yahoo.com', // replace with your email
    to: 'kesarwanimohit@yahoo.com',
    subject: `Trading Signal: ${signalType}`,
    text: `Signal Type: ${signalType}\nTimestamp: ${timestamp}\nCurrent Price: ${currentPrice}\nIndicator Summary:\n${indicatorSummary}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email notification sent for ${signalType}`);
    return true; // Indicate success
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false; // Indicate failure
  }
}


// Example route to trigger a signal and send email (replace with your actual signal generation logic)
router.post('/signal', async (req, res) => {
  const { signalType, currentPrice, indicatorSummary } = req.body; // signalType should be "Strong Buy" or "Strong Sell"

  if (!['Strong Buy', 'Strong Sell'].includes(signalType)) {
    return res.status(400).json({ error: 'Invalid signal type. Must be "Strong Buy" or "Strong Sell".' });
  }

  const timestamp = new Date().toISOString();

  const emailSent = await sendEmailNotification(signalType, timestamp, currentPrice, indicatorSummary);

  if (emailSent) {
      res.status(200).json({ message: `Signal "${signalType}" received and email notification sent.` });
  } else {
      res.status(500).json({ message: `Signal "${signalType}" received, but email notification failed to send (possibly due to rate limiting).` });
  }
});



// Example route to fetch backend context
router.get('/context', async (req, res) => {
    const context = await loadContextFor('Backend');
    res.send(context);
});


module.exports = router;
```