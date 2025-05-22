import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const { TWELVE_DATA_API_KEY } = process.env;

app.get('/api/btc-data', async (req, res) => {
  if (!TWELVE_DATA_API_KEY) {
    return res.status(500).json({ error: 'TWELVE_DATA_API_KEY is not configured' });
  }

  try {
    const priceUrl = `https://api.twelvedata.com/price?symbol=BTC/USD&apikey=${TWELVE_DATA_API_KEY}`;
    const rsiUrl = `https://api.twelvedata.com/rsi?symbol=BTC/USD&interval=1h&time_period=14&series_type=close&apikey=${TWELVE_DATA_API_KEY}`;

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
