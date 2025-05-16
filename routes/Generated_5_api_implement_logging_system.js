const express = require('express');
const moment = require('moment-timezone');
const { loadContextFor } = require('./context/contextLoader');
const { loadContextFor: loadGithubContextFor } = require('./context/githubContextLoader');

const app = express();
app.use(express.json());

// Configure moment-timezone for AEST
moment.tz.setDefault('Australia/Sydney');

const logger = (req, res, next) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

app.use(logger);


//Example Endpoint (replace with your actual price fetching and signal generation logic)
app.get('/api/prices', async (req, res) => {
  try {
    //Simulate fetching price data
    const priceData = {
      symbol: 'AAPL',
      price: 150.25,
      timestamp: moment().toISOString()
    };

    //Log fetched price data with timestamp in AEST
    const logMessage = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] Fetched price data: ${JSON.stringify(priceData)}`;
    console.log(logMessage);


    //Simulate generating signals (strong and weak)
    const signals = [
      { type: 'strongBuy', timestamp: moment().toISOString() },
      { type: 'weakSell', timestamp: moment().toISOString() }
    ];

    //Log generated signals with timestamps in AEST
    signals.forEach(signal => {
      const logMessage = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] Generated signal: ${JSON.stringify(signal)}`;
      console.log(logMessage);
    })

    //Simulate sending email notifications (replace with your actual email sending logic)
    const emailSent = true;
    if (emailSent) {
      const logMessage = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] Sent email notification for signals: ${JSON.stringify(signals)}`;
      console.log(logMessage);
    }

    res.json({ priceData, signals });
  } catch (error) {
    console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Error fetching prices:`, error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});


// Context Loaders as API Endpoints

app.get('/api/context/:component', (req, res) => {
  const component = req.params.component;
  const context = loadContextFor(component);
  res.send(context);
});

app.get('/api/github/context/:component', async (req, res) => {
  const component = req.params.component;
  const context = await loadGithubContextFor(component);
  res.send(context);
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});