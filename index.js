import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TWELVE_DATA_API_KEY || '';

const BASE_URL = 'https://api.twelvedata.com';

const endpoints = {
  rsi: `${BASE_URL}/rsi?symbol=BTC/USD&interval=1h&time_period=14&series_type=close`,
  macd: `${BASE_URL}/macd?symbol=BTC/USD&interval=1h&series_type=close`,
  ema20: `${BASE_URL}/ema?symbol=BTC/USD&interval=1h&time_period=20&series_type=close`,
  sma50: `${BASE_URL}/sma?symbol=BTC/USD&interval=1h&time_period=50&series_type=close`,
  bbands: `${BASE_URL}/bbands?symbol=BTC/USD&interval=1h&time_period=20&series_type=close&sd=2`
};

app.get('/api/btc-indicators', async (req, res) => {
  const headers = API_KEY ? { 'Authorization': `apikey ${API_KEY}` } : {};
  const fetchIndicator = async (name, url) => {
    try {
      const { data } = await axios.get(url, { headers });
      return { name, data };
    } catch (err) {
      return { name, error: err.message };
    }
  };

  const promises = Object.entries(endpoints).map(([name, url]) =>
    fetchIndicator(name, url)
  );

  const results = await Promise.all(promises);

  const response = {};
  const errors = [];

  results.forEach((result) => {
    if (result.error) {
      errors.push({ indicator: result.name, message: result.error });
    } else {
      response[result.name] = result.data;
    }
  });

  if (errors.length) {
    response.errors = errors;
  }

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

