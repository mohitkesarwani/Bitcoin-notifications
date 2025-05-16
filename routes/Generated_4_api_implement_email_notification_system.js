const express = require('express');
const app = express();
const port = 3000;
const { loadContextFor } = require('./context/contextLoader');
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Rate limiting middleware (4 hours)
const limiter = rateLimit({
  windowMs: 4 * 60 * 60 * 1000, // 4 hours
  max: 1, // Limit each IP to 1 request per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// API routes
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadContextFor(component);
    res.send(context);
  } catch (error) {
    console.error("Error fetching local context:", error);
    res.status(500).send('Error fetching context');
  }
});


app.get('/github/:component', limiter, async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadGitHubContext(component);
    res.send(context);
  } catch (error) {
    console.error("Error fetching GitHub context:", error);
    res.status(500).send('Error fetching GitHub context');
  }
});


app.post('/signal', async (req, res) => {
  const { signalType, currentPrice, indicators } = req.body;

  //Basic validation.  More robust validation should be added in a production environment.
  if (!signalType || !currentPrice || !indicators) {
    return res.status(400).json({ error: 'Missing required fields' });
  }


  if (signalType === 'Strong Buy' || signalType === 'Strong Sell') {
    const now = new Date();
    const aest = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 10 * 60 * 60 * 1000); //Convert to AEST
    const formattedDate = aest.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'kesarwanimohit@yahoo.com',
      subject: `Trading Signal: ${signalType}`,
      text: `
        Signal Type: ${signalType}
        Timestamp (AEST): ${formattedDate}
        Current Price: ${currentPrice}
        Indicators: ${indicators}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
      res.status(200).json({ message: 'Signal received and email sent' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  } else {
    res.status(200).json({ message: 'Signal received' }); //No email for other signal types.
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});