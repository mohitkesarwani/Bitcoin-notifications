import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.get('/api/btc-data', async (req, res) => {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'TWELVE_DATA_API_KEY is not configured' });
  }

  try {
    const priceUrl = `https://api.twelvedata.com/price?symbol=BTC/USD&apikey=${apiKey}`;
    const rsiUrl = `https://api.twelvedata.com/rsi?symbol=BTC/USD&interval=1h&time_period=14&series_type=close&apikey=${apiKey}`;

    const [priceRes, rsiRes] = await Promise.all([
      axios.get(priceUrl),
      axios.get(rsiUrl)
    ]);

    const price = priceRes.data.price || null;
    let rsi = null;
    if (Array.isArray(rsiRes.data.values) && rsiRes.data.values.length > 0) {
      rsi = rsiRes.data.values[0].rsi;
    } else if (typeof rsiRes.data.rsi !== 'undefined') {
      rsi = rsiRes.data.rsi;
    }

    return res.json({ price, rsi });
  } catch (error) {
    console.error('Error fetching BTC data', error.message);
    return res.status(500).json({ error: 'Failed to fetch BTC data' });
  }
});

app.get('/api/btc-indicators', async (req, res) => {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'TWELVE_DATA_API_KEY is not configured' });
  }

  const endpoints = {
    rsi: 'https://api.twelvedata.com/rsi?symbol=BTC/USD&interval=1h&time_period=14&series_type=close',
    macd: 'https://api.twelvedata.com/macd?symbol=BTC/USD&interval=1h&series_type=close',
    ema20: 'https://api.twelvedata.com/ema?symbol=BTC/USD&interval=1h&time_period=20&series_type=close',
    sma50: 'https://api.twelvedata.com/sma?symbol=BTC/USD&interval=1h&time_period=50&series_type=close',
    bbands: 'https://api.twelvedata.com/bbands?symbol=BTC/USD&interval=1h&time_period=20&series_type=close&sd=2'
  };

  try {
    const requests = Object.entries(endpoints).map(([key, baseUrl]) =>
      axios
        .get(`${baseUrl}&apikey=${apiKey}`)
        .then((response) => ({ key, data: response.data }))
        .catch((error) => ({ key, error: error.message }))
    );

    const results = await Promise.all(requests);

    const responseData = {};
    const errors = [];

    results.forEach((result) => {
      if (result.data) {
        responseData[result.key] = result.data;
      } else {
        errors.push({ indicator: result.key, error: result.error });
      }
    });

    if (errors.length) {
      responseData.errors = errors;
    }

    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching BTC indicators', error.message);
    return res.status(500).json({ error: 'Failed to fetch BTC indicators' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
