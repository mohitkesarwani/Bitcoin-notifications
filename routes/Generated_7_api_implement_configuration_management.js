// config/config.js
require('dotenv').config();

const config = {
  apiKey: process.env.API_KEY || 'default_api_key',
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'default@gmail.com',
    pass: process.env.EMAIL_PASS || 'default_password',
    recipient: process.env.EMAIL_RECIPIENT || 'recipient@example.com',
  },
  indicatorThresholds: {
    high: parseFloat(process.env.INDICATOR_THRESHOLD_HIGH) || 0.8,
    medium: parseFloat(process.env.INDICATOR_THRESHOLD_MEDIUM) || 0.5,
  },
  dataFetchingInterval: parseInt(process.env.DATA_FETCHING_INTERVAL, 10) || 60000, // Default: 60 seconds
  emailRateLimit: {
    maxEmailsPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_MAX, 10) || 10,
  },
};

module.exports = config;
