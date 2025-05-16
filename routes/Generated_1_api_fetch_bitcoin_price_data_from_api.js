const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const logger = require('./logger'); // Assuming you have a logger module

const app = express();
const port = 3000;

// Configuration (move to a config file in production)
const apiUrl = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'; // CoinGecko API
const updateInterval = process.env.UPDATE_INTERVAL || '*/15 * * * *'; // Default to every 15 minutes

let bitcoinData = {};

// Fetch and update Bitcoin data
async function fetchBitcoinData() {
  try {
    const response = await axios.get(apiUrl);
    const prices = response.data.prices;
    // Extract Open, High, Low, Close, Volume (simplified - adapt to API response structure)
    const lastPrice = prices[prices.length - 1];
    const open = lastPrice[1];
    const high = Math.max(...prices.map(p => p[1]));
    const low = Math.min(...prices.map(p => p[1]));
    const close = lastPrice[1];
    const volume = 0; //Placeholder - Needs proper extraction based on API response
    bitcoinData = { open, high, low, close, volume };
    logger.info('Bitcoin data updated successfully.');
  } catch (error) {
    logger.error('Failed to fetch Bitcoin data:', error);
  }
}


//Schedule the data fetching job
cron.schedule(updateInterval, fetchBitcoinData);

// Initial fetch on startup
fetchBitcoinData();

app.get('/bitcoin', (req, res) => {
  if (Object.keys(bitcoinData).length === 0) {
    return res.status(503).json({ error: 'Bitcoin data not yet available. Please try again later.' });
  }
  res.json(bitcoinData);
});

app.listen(port, () => {
  logger.info(`Bitcoin price API listening on port ${port}`);
});

//Example logger module (logger.js)
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    // Add other transports for production (e.g., file logging)
  ],
});
module.exports = logger;