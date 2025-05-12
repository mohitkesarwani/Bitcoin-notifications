// btcPriceFetcher.js
const axios = require('axios');
const { loadContextFor } = require('./context/contextLoader'); // Assuming contextLoader is needed for config
require('dotenv').config();

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart';

let btcPriceData = [];

async function fetchBTCPriceData(days = 1) {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}?vs_currency=usd&days=${days}`);
    const { prices, volumes } = response.data;

    btcPriceData = prices.map((price, index) => {
      const [timestamp, close] = price;
      const volume = volumes[index][1];
      return {
        timestamp,
        open: prices[index > 0 ? index - 1 : 0][1], // Use previous close as open, or first close as open
        high: Math.max(...prices.slice(index > 9 ? index - 9 : 0, index + 1).map((p) => p[1])), // Simple rolling max
        low: Math.min(...prices.slice(index > 9 ? index - 9 : 0, index + 1).map((p) => p[1])), // Simple rolling min
        close,
        volume,
      };
    });

    return btcPriceData;
  } catch (error) {
    console.error('Failed to fetch BTC price data:', error.message);
    return null;
  }
}

function getLatestBTCPriceData() {
  return btcPriceData.length > 0 ? btcPriceData[btcPriceData.length - 1] : null;
}

module.exports = { fetchBTCPriceData, getLatestBTCPriceData };

// scheduler.js
const { fetchBTCPriceData } = require('./btcPriceFetcher');

const DEFAULT_INTERVAL = 15 * 60 * 1000; // 15 minutes

async function startBTCPricingScheduler(interval = DEFAULT_INTERVAL) {
  try {
    await fetchBTCPriceData(); // Initial fetch

    setInterval(async () => {
      await fetchBTCPriceData();
    }, interval);

    console.log('BTC Pricing Scheduler started.');
  } catch (error) {
    console.error('Failed to start BTC Pricing Scheduler:', error.message);
  }
}

module.exports = { startBTCPricingScheduler };

// Example usage (index.js or similar entry point):
// const { startBTCPricingScheduler } = require('./scheduler');
// startBTCPricingScheduler();
