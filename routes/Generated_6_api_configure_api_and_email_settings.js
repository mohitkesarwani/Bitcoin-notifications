// config.js
require('dotenv').config();

const config = {
  apiKey: process.env.API_KEY || 'default_api_key',
  emailCredentials: {
    user: process.env.EMAIL_USER || 'default_user',
    pass: process.env.EMAIL_PASS || 'default_password',
  },
  dataFetchInterval: parseInt(process.env.DATA_FETCH_INTERVAL || 60000, 10), // Default: 60 seconds
  emailFrequency: parseInt(process.env.EMAIL_FREQUENCY || 86400000, 10), // Default: 24 hours
  technicalIndicators: {
    rsiPeriod: parseInt(process.env.RSI_PERIOD || 14, 10),
    maPeriod: parseInt(process.env.MA_PERIOD || 20, 10),
    // Add other technical indicator parameters as needed
  },
};


// validateConfig.js
const config = require('./config');

function validateConfig() {
  const errors = [];
  if (!config.apiKey) errors.push('API_KEY is missing.');
  if (!config.emailCredentials.user || !config.emailCredentials.pass) {
    errors.push('EMAIL_USER and EMAIL_PASS are missing.');
  }
  if (isNaN(config.dataFetchInterval) || config.dataFetchInterval <= 0) {
    errors.push('DATA_FETCH_INTERVAL must be a positive number.');
  }
  if (isNaN(config.emailFrequency) || config.emailFrequency <= 0) {
    errors.push('EMAIL_FREQUENCY must be a positive number.');
  }
  if (isNaN(config.technicalIndicators.rsiPeriod) || config.technicalIndicators.rsiPeriod <= 0) {
    errors.push('RSI_PERIOD must be a positive number.');
  }
  if (isNaN(config.technicalIndicators.maPeriod) || config.technicalIndicators.maPeriod <= 0) {
    errors.push('MA_PERIOD must be a positive number.');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
  console.log("Configuration validated successfully.");
}

module.exports = {validateConfig};

// server.js
const express = require('express');
const { loadContextFor } = require('./context/contextLoader'); // or githubContextLoader if using github
const {validateConfig} = require('./validateConfig');
const config = require('./config');

const app = express();
const port = 3000;

validateConfig();

app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  const context = await loadContextFor(component);
  res.send(context);
});

app.get('/config', (req, res) => {
    res.json(config); //removed sensitive data
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});