const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { loadContextFor } = require('./context/contextLoader'); // Use local context loader for testing

const app = express();
const port = 3000;

// Configuration (move to .env or config file in production)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart';
const UPDATE_INTERVAL_MINUTES = 15; // Default update interval
const DEFAULT_VS_CURRENCY = 'usd';

// In-memory storage for BTC price data (replace with a database in production)
let btcPriceData = {};

// Function to fetch BTC price data from CoinGecko API
async function fetchBtcPriceData(vs_currency = DEFAULT_VS_CURRENCY, days = '1') {
  try {
    const url = `${COINGECKO_API_URL}?vs_currency=${vs_currency}&days=${days}`;
    const response = await axios.get(url);
    return response.data.prices;
  } catch (error) {
    console.error('Error fetching BTC price data:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      // Handle specific error codes like rate limiting (429)
      if (error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.log(`Rate limit hit. Retrying after ${retryAfter} seconds.`);
        // Implement retry logic here if needed.
      }
    }
    return null; // Return null to indicate failure
  }
}

// API route to get BTC price data
app.get('/api/btc-price', async (req, res) => {
  const vsCurrency = req.query.vs_currency || DEFAULT_VS_CURRENCY;
  const days = req.query.days || '1'; // Allow querying for different time ranges

  if (!btcPriceData[vsCurrency]) {
    btcPriceData[vsCurrency] = await fetchBtcPriceData(vsCurrency, days);
  }

  if (btcPriceData[vsCurrency]) {
    res.json({
      vs_currency: vsCurrency,
      data: btcPriceData[vsCurrency],
    });
  } else {
    res.status(500).json({ error: 'Failed to retrieve BTC price data' });
  }
});

// Scheduled task to update BTC price data
cron.schedule(`*/${UPDATE_INTERVAL_MINUTES} * * * *`, async () => {
  console.log('Updating BTC price data...');
  btcPriceData[DEFAULT_VS_CURRENCY] = await fetchBtcPriceData();
  //Consider adding other currency pairs here.  e.g., btcPriceData['eur'] = await fetchBtcPriceData('eur');
});


//Route to get context (for testing purposes. Remove in production)
app.get('/context/:component', (req, res) => {
  const component = req.params.component;
  const context = loadContextFor(component);
  res.send(context);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});