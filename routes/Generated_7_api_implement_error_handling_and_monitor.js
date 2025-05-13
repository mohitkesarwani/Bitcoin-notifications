const express = require('express');
const app = express();
const port = 3000;
const contextLoader = require('./context/contextLoader');
const githubContextLoader = require('./context/githubContextLoader');
const axios = require('axios');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

app.use(express.json());

// API route to load context
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    let context;

    // Prioritize local context if available, fallback to GitHub
    try {
      context = contextLoader.loadContextFor(component);
    } catch (localErr) {
      logger.warn(` Local context loading failed for ${component}:`, localErr.message);
      context = await githubContextLoader.loadContextFor(component);
    }

    if (!context || context.trim() === '') {
      return res.status(404).json({ error: `Context not found for ${component}` });
    }

    res.json({ context });
    logger.info(`Context loaded successfully for ${component}`);
  } catch (error) {
    logger.error(`Error loading context for ${component}:`, error);
    res.status(500).json({ error: 'Failed to load context' });
  }
});

//Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

// Example of monitoring data integrity (replace with your actual data integrity checks)
setInterval(async () => {
  try {
    const localCheck = contextLoader.loadContextFor('Frontend');
    const githubCheck = await githubContextLoader.loadContextFor('Frontend');
    if (localCheck !== githubCheck && githubCheck.length > 0) {
      logger.warn(' Potential data integrity issue: Local and GitHub contexts differ for Frontend');
    }
    // Add more data integrity checks as needed
  } catch (error) {
    logger.error('Error during data integrity check:', error);
  }
}, 60000); // Check every minute
