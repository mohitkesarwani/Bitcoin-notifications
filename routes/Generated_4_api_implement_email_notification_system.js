const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { loadContextFor } = require('./context/contextLoader');
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader');

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const RATE_LIMIT_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 1, // Limit to 1 email per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your email provider
  auth: {
    user: EMAIL_ADDRESS,
    pass: EMAIL_PASSWORD,
  },
});

// API route for generating signals and sending emails
app.post('/generateSignal', limiter, async (req, res) => {
  const { signalType, currentPrice, indicators } = req.body;

  // Input validation
  if (!signalType || !currentPrice || !indicators) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['Strong Buy', 'Strong Sell'].includes(signalType)) {
    return res.status(400).json({ error: 'Invalid signal type' });
  }

  const timestampAEST = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  const emailSubject = `${signalType} Signal Generated`;
  const emailBody = `
    Signal Type: ${signalType}
    Timestamp (AEST): ${timestampAEST}
    Current Price: ${currentPrice}
    Indicators: ${indicators}
  `;

  try {
    // Send email
    await transporter.sendMail({
      from: EMAIL_ADDRESS,
      to: EMAIL_ADDRESS,
      subject: emailSubject,
      text: emailBody,
    });

    // Log successful signal generation and email sent
    console.log(`Signal generated and email sent: ${emailBody}`);
    res.status(200).json({ message: 'Signal generated and email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// API route to fetch context (example usage)
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const localContext = loadContextFor(component);
    const gitHubContext = await loadGitHubContext(component);

    res.json({ localContext, gitHubContext });
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
