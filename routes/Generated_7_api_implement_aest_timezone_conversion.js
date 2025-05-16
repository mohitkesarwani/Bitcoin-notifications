const express = require('express');
const app = express();
const port = 3000;
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadContextFor } = require('./context/contextLoader');
const { loadContextFor: loadGithubContextFor } = require('./context/githubContextLoader');
const moment = require('moment-timezone');

moment.tz.setDefault('Australia/Sydney');


app.use(express.json());

// Log all requests with timestamp in AEST
app.use((req, res, next) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`${timestamp} ${req.method} ${req.url}`);
  next();
});


app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadContextFor(component);
    res.send(context);
  } catch (error) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    console.error(`${timestamp} Error loading local context:`, error);
    res.status(500).send('Error loading context');
  }
});

app.get('/github/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadGithubContextFor(component);
    res.send(context);
  } catch (error) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    console.error(`${timestamp} Error loading GitHub context:`, error);
    res.status(500).send('Error loading context');
  }
});


//Error Handling Middleware
app.use((err, req, res, next) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.error(`${timestamp} Unhandled Error:`, err);
  res.status(500).send('An unexpected error occurred.');
});


app.listen(port, () => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`${timestamp} Server listening on port ${port}`);
});