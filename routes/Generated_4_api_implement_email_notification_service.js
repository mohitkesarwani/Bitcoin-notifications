const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const moment = require('moment-timezone');

const app = express();
app.use(express.json());

// Configure moment-timezone for AEST
moment.tz.setDefault('Australia/Sydney');

// Rate limiting: 1 email per 5 minutes
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Email configuration (replace with your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your email provider
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
  },
});

//  Signal generation endpoint (example - replace with your actual signal generation logic)
app.post('/generateSignal', limiter, async (req, res) => {
  const { signalType, currentPrice, indicators } = req.body;

  // Input validation
  if (!signalType || !currentPrice || !indicators) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['Strong Buy', 'Strong Sell'].includes(signalType)) {
    return res.status(400).json({ error: 'Invalid signal type' });
  }


  //Only send email for Strong Buy or Strong Sell signals
  if (['Strong Buy', 'Strong Sell'].includes(signalType)) {
    try {
      // Send email notification
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: 'kesarwanimohit@yahoo.com',
        subject: `Trading Signal: ${signalType}`,
        html: `
          <h1>Trading Signal Generated: ${signalType}</h1>
          <p>Timestamp (AEST): ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
          <p>Current Price: ${currentPrice}</p>
          <p>Indicators Summary: ${indicators}</p>
        `,
      };
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
      res.status(200).json({ message: 'Signal generated and email sent' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email notification' });
    }
  } else {
    res.status(200).json({ message: 'Signal generated, but email not sent for this signal type.' });
  }

});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});