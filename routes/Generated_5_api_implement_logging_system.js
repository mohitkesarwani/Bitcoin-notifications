const express = require('express');
const app = express();
const port = 3000;
const fs = require('node:fs');
const path = require('node:path');
const { loadContextFor: loadLocalContext } = require('./context/contextLoader');
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});


app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  logger.info(`Request received: ${req.method} ${req.url}`);
  next();
});


app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const localContext = loadLocalContext(component);
    logger.info(`Local context loaded for ${component}:`, localContext);
    const githubContext = await loadGitHubContext(component);
    logger.info(`GitHub context loaded for ${component}:`, githubContext);

    //Combine local and github context.  Prioritize local if both exist.
    const context = localContext.length > 0 ? localContext : githubContext;
    res.send(context);
  } catch (error) {
    logger.error(`Error loading context for ${component}:`, error);
    res.status(500).send(`Error loading context for ${component}: ${error.message}`);
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).send('Something broke!');
});


app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

module.exports = app; // for testing