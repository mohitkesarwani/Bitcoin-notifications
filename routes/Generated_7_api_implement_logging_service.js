// backend/services/logger.js
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, json, errors } = format;

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'your-service-name' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;

// backend/middleware/requestLogger.js
const logger = require('../services/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      message: 'Incoming request',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

module.exports = requestLogger;

// backend/utils/emailService.js
const logger = require('../services/logger');

async function sendEmail(to, subject, body) {
  try {
    // Simulate sending an email
    console.log(`Simulating sending email to ${to} with subject: ${subject}`);
    logger.info({
      message: 'Email sent',
      to,
      subject,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to send email',
      to,
      subject,
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = { sendEmail };

// backend/routes/index.js
const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const { sendEmail } = require('../utils/emailService');

router.get('/', (req, res) => {
  logger.info('Accessed the root route');
  res.send('Hello, world!');
});

router.post('/data', (req, res) => {
  const data = req.body;
  logger.info({ message: 'Received data', data });
  res.json({ message: 'Data received', data });
});

router.get('/signals', (req, res) => {
  const signals = ['signal1', 'signal2', 'weakSignal'];
  logger.info({ message: 'Generated signals', signals });
  res.json({ signals });
});

router.post('/email', async (req, res) => {
  const { to, subject, body } = req.body;
  try {
    await sendEmail(to, subject, body);
    res.status(200).send('Email sent successfully.');
  } catch (error) {
    logger.error({ message: 'Failed to send email from route', error: error.message, stack: error.stack });
    res.status(500).send('Failed to send email.');
  }
});

module.exports = router;

// backend/server.js
const express = require('express');
const app = express();
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./services/logger');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger); // Apply the request logger middleware
app.use('/', routes);

app.use((err, req, res, next) => {
  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    req: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
    },
  });
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logger.info(`Server is running on port ${PORT}`);
});
