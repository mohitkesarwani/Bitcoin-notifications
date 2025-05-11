```javascript
// config/config.js
const dotenv = require('dotenv');
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || 'YOUR_DEFAULT_API_KEY',
  apiRefreshInterval: parseInt(process.env.API_REFRESH_INTERVAL, 10) || 60000, // Default: 60 seconds
  emailSettings: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'your_email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_email_password',
    recipient: process.env.EMAIL_RECIPIENT || 'recipient_email@example.com'
  },
  indicatorPeriods: {
    short: parseInt(process.env.INDICATOR_PERIOD_SHORT, 10) || 14, // Default: 14 periods
    long: parseInt(process.env.INDICATOR_PERIOD_LONG, 10) || 28 // Default: 28 periods
  },
  notificationFrequencyLimits: {
    email: parseInt(process.env.NOTIFICATION_EMAIL_LIMIT, 10) || 5, // Default: 5 emails per hour
    sms: parseInt(process.env.NOTIFICATION_SMS_LIMIT, 10) || 10 // Default: 10 SMS per hour
  },
  github: {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    token: process.env.GITHUB_TOKEN,
  }
};

module.exports = config;

// Example usage in a route:
// const config = require('./config/config');
// app.get('/api/data', (req, res) => {
//   const apiKey = config.apiKey;
//   // ... use apiKey to fetch data
// });

// You can also access nested config values like:
// const emailUser = config.emailSettings.user;
```