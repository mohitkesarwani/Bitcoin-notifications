const express = require('express');
const app = express();
const port = 3000;
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadContextFor: loadLocalContext } = require('./context/contextLoader');
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'combined.log' })],
});

// Middleware to log requests
app.use((req, res, next) => {
  logger.info({
    level: 'info',
    message: 'Request received',
    timestamp: new Date(),
    method: req.method,
    url: req.url,
    headers: req.headers,
  });
  next();
});

// Route to fetch context (local or GitHub)
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  const source = req.query.source || 'local'; //Default to local if not specified

  try {
    let context;
    if (source === 'github') {
      context = await loadGitHubContext(component);
      logger.info({
        level: 'info',
        message: 'GitHub context loaded',
        timestamp: new Date(),
        component: component,
        contextLength: context.length,
      });
    } else {
      context = loadLocalContext(component);
      logger.info({
        level: 'info',
        message: 'Local context loaded',
        timestamp: new Date(),
        component: component,
        contextLength: context.length,
      });
    }
    res.send(context);
  } catch (error) {
    logger.error({
      level: 'error',
      message: 'Error fetching context',
      timestamp: new Date(),
      component: component,
      source: source,
      error: error.message,
    });
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    level: 'error',
    message: 'Unhandled error',
    timestamp: new Date(),
    error: err.stack,
  });
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  logger.info({
    level: 'info',
    message: 'Server listening on port',
    timestamp: new Date(),
    port: port,
  });
  console.log(`Server listening on port ${port}`);
});
