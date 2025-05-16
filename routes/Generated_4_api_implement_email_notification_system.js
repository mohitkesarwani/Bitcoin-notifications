const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const contextLoaders = {
  local: require('./context/contextLoader'),
  github: require('./context/githubContextLoader'),
};

const app = express();
app.use(express.json());

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 4 * 60 * 60 * 1000, // 4 hours
  max: 1, // limit each IP to 1 request per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});


// Email sending function
async function sendEmail(signal) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'kesarwanimohit@yahoo.com',
    subject: `Trading Signal: ${signal}`,
    text: `A ${signal} signal has been generated.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


app.post('/context/:type', limiter, async (req, res) => {
  const { type } = req.params;
  const { component } = req.body;
  const source = req.query.source || 'local'; // Default to local if not specified

  if (!['local', 'github'].includes(source)) {
    return res.status(400).json({ error: 'Invalid source type. Choose "local" or "github".' });
  }

  try {
    const context = await contextLoaders[source].loadContextFor(component);
    res.json({ context });

    // Check for strong buy/sell signals (replace with your actual signal logic)
    if (context.includes('Strong Buy')) {
      sendEmail('Strong Buy');
    } else if (context.includes('Strong Sell')) {
      sendEmail('Strong Sell');
    }
  } catch (error) {
    console.error('Error loading context:', error);
    res.status(500).json({ error: 'Failed to load context.' });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));