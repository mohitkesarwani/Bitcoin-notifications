const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
const TA = require('technicalindicators');

// Configuration (move to config file in production)
const bitcoinAPI = 'https://api.coindesk.com/v1/bpi/historical/close.json?'; //Example API, replace with a robust one.
const defaultPeriod = 20; // Default period for indicators

//Indicator Calculation Functions
function calculateEMA(data, period = defaultPeriod) {
  const ema = new TA.EMA({ period: period, values: data.map((item) => item.bpi.USD.toFixed(2)) });
  return ema.result;
}

function calculateRSI(data, period = defaultPeriod) {
  const rsi = new TA.RSI({ period: period, values: data.map((item) => item.bpi.USD.toFixed(2)) });
  return rsi.result;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const macd = new TA.MACD({
    values: data.map((item) => item.bpi.USD.toFixed(2)),
    fastPeriod: fastPeriod,
    slowPeriod: slowPeriod,
    signalPeriod: signalPeriod,
  });
  return macd.result;
}

function calculateBollingerBands(data, period = defaultPeriod, stdDev = 2) {
  const bollingerBands = new TA.BollingerBands({
    period: period,
    values: data.map((item) => item.bpi.USD.toFixed(2)),
    stdDev: stdDev,
  });
  return bollingerBands.result;
}

// API Routes
app.get('/api/bitcoin/indicators', async (req, res) => {
  try {
    const {
      startDate = '2023-10-26',
      endDate = '2023-11-26',
      period = defaultPeriod,
      fastPeriod = 12,
      slowPeriod = 26,
      signalPeriod = 9,
      stdDev = 2,
    } = req.query;

    const url = `${bitcoinAPI}start=${startDate}&end=${endDate}`;
    const response = await axios.get(url);
    const data = response.data.bpi;
    const priceData = Object.entries(data).map(([date, price]) => ({ date, bpi: { USD: price } }));

    const ema = calculateEMA(priceData, period);
    const rsi = calculateRSI(priceData, period);
    const macd = calculateMACD(priceData, fastPeriod, slowPeriod, signalPeriod);
    const bollingerBands = calculateBollingerBands(priceData, period, stdDev);

    res.json({ ema, rsi, macd, bollingerBands });
  } catch (error) {
    console.error('Error fetching or processing Bitcoin data:', error);
    res.status(500).json({ error: 'Failed to fetch or process Bitcoin data' });
  }
});

app.listen(port, () => {
  console.log(`Bitcoin indicator API listening at http://localhost:${port}`);
});
