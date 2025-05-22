const express = require('express');
const axios = require('axios');
const { RSI, MACD, BollingerBands } = require('technicalindicators');

const router = express.Router();

async function fetchPrices() {
  const res = await axios.get('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100');
  return res.data.map(k => parseFloat(k[4]));
}

router.get('/', async (req, res) => {
  try {
    const closes = await fetchPrices();
    const rsi = RSI.calculate({ values: closes, period: 14 }).pop();
    const macdArr = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMA: false });
    const macd = macdArr.pop();
    const bbArr = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
    const bbands = bbArr.pop();
    res.json({
      price: closes[closes.length - 1],
      rsi,
      macd: macd ? { value: macd.MACD, signal: macd.signal } : null,
      bbands,
    });
  } catch (err) {
    console.error('Indicator error:', err.message);
    res.status(500).json({ error: 'Failed to fetch indicators' });
  }
});

module.exports = router;
