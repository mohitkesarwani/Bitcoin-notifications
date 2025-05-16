const express = require('express');
const app = express();
const port = 3000;
const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;
const contextLoader = require('./context/contextLoader');
const githubContextLoader = require('./context/githubContextLoader');

// Configure Winston logger
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    label({ label: 'App' }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
});


app.use(express.json());

// API routes
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  logger.info(`Fetching context for component: ${component}`);
  try {
    let context;
    if (process.env.GITHUB_TOKEN) {
      context = await githubContextLoader.loadContextFor(component);
      logger.info(`GitHub context loaded successfully for component: ${component}`);
    } else {
      context = contextLoader.loadContextFor(component);
      logger.info(`Local context loaded successfully for component: ${component}`);
    }

    res.json({ context });
  } catch (error) {
    logger.error(`Error fetching context for ${component}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});


// Start the server
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});