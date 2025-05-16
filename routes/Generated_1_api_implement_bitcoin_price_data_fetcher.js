const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { loadContextFor } = require('./context/contextLoader'); //For demonstration, using existing contextLoader
const app = express();
const port = 3000;

// Configuration (can be moved to a separate config file)
const apiProvider = 'coingecko'; // 'coingecko' or 'coincap'
const updateIntervalMinutes = 15;
let btcData = {};

// API endpoints
const coinGeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1';
const coinCapEndpoint = 'https://api.coincap.io/v2/assets/bitcoin/history?interval=d1';


async function fetchBTCPrice() {
  try {
    let res;
    if (apiProvider === 'coingecko') {
      res = await axios.get(coinGeckoEndpoint);
      btcData = {
        open: res.data.prices[0][1],
        high: Math.max(...res.data.prices.map(p => p[1])),
        low: Math.min(...res.data.prices.map(p => p[1])),
        close: res.data.prices[res.data.prices.length - 1][1],
        volume: res.data.total_volumes[res.data.total_volumes.length-1][1] // Approximation - daily volume
      };
    } else if (apiProvider === 'coincap') {
      res = await axios.get(coinCapEndpoint);
      //Adapt the response structure from coincap API here
       btcData = {
        open: res.data.data[0].priceUsd,
        high:  res.data.data[0].priceUsd, // Needs adaptation to get high, low from CoinCap API (not directly available in daily data)
        low: res.data.data[0].priceUsd,   // Needs adaptation to get high, low from CoinCap API (not directly available in daily data)
        close: res.data.data[res.data.data.length - 1].priceUsd,
        volume: res.data.data[res.data.data.length - 1].volumeUsd
      };
    } else {
      throw new Error('Invalid API provider.');
    }
    console.log('BTC Price updated successfully:', btcData);
  } catch (error) {
    console.error('Error fetching BTC price:', error);
  }
}


// Schedule the price update
cron.schedule(`*/${updateIntervalMinutes} * * * *`, fetchBTCPrice);

// Initialize with first fetch
fetchBTCPrice();

app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  const context = await loadContextFor(component);
  res.send(context);
});


app.get('/btc', (req, res) => {
  res.json(btcData);
});

app.listen(port, () => {
  console.log(`BTC price API listening on port ${port}`);
});