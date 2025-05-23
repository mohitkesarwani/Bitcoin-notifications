import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { run as evaluateSignalJob } from './cron/evaluateAndLog.js';

// Simple in-memory cache to avoid excessive Twelve Data requests
const cache = {};

/**
 * Fetch data from a URL with caching.
 * @param {string} url - The Twelve Data endpoint including query params.
 * @param {string} key - Unique cache key for the request.
 * @returns {Promise<any>} The fetched or cached data.
 */
async function fetchWithCache(url, key, context = '') {
  const ttlMinutes = parseInt(process.env.CACHE_TTL_MINUTES || '60', 10);
  const now = Date.now();
  const cached = cache[key];
  if (cached && now - cached.timestamp < ttlMinutes * 60 * 1000) {
    const prefix = context ? `[${context}] ` : '';
    console.log(`[CACHE]${prefix}using cached data for ${key}`);
    return cached.data;
  }
  try {
    const prefix = context ? `[${context}] ` : '';
    console.log(`[API]${prefix}fetching ${key} from Twelve Data`);
    const response = await axios.get(url);
    cache[key] = { data: response.data, timestamp: now };
    return response.data;
  } catch (err) {
    const prefix = context ? `[${context}] ` : '';
    console.error(`[API]${prefix}failed to fetch ${key}`, err.message);
    throw err;
  }
}

dotenv.config();

const parseNumber = (value) => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
};

const parseBool = (value) => String(value).toLowerCase() === 'true';

// Map trading pairs to friendly asset names for logging
const assetNames = {
  'BTC/USD': 'Bitcoin',
  'SOL/USD': 'Solana',
  'XRP/USD': 'XRP',
  'ADA/USD': 'Cardano'
};

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

    const asset = assetNames['BTC/USD'] || 'BTC/USD';
    const [priceRes, rsiRes] = await Promise.all([
      fetchWithCache(priceUrl, 'price', asset),
      fetchWithCache(rsiUrl, 'rsi', asset)
    ]);

    const price = priceRes.price || null;
    let rsi = null;
    if (Array.isArray(rsiRes.values) && rsiRes.values.length > 0) {
      rsi = rsiRes.values[0].rsi;
    } else if (typeof rsiRes.rsi !== 'undefined') {
      rsi = rsiRes.rsi;
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

  const symbol = req.query.symbol || 'BTC/USD';

  const endpoints = {
    rsi: `https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1h&time_period=14&series_type=close`,
    macd: `https://api.twelvedata.com/macd?symbol=${symbol}&interval=1h&series_type=close`,
    ema20: `https://api.twelvedata.com/ema?symbol=${symbol}&interval=1h&time_period=20&series_type=close`,
    sma50: `https://api.twelvedata.com/sma?symbol=${symbol}&interval=1h&time_period=50&series_type=close`,
    bbands: `https://api.twelvedata.com/bbands?symbol=${symbol}&interval=1h&time_period=20&series_type=close&sd=2`,
    stochastic: `https://api.twelvedata.com/stoch?symbol=${symbol}&interval=1h`,
    adx: `https://api.twelvedata.com/adx?symbol=${symbol}&interval=1h&time_period=14`,
    cci: `https://api.twelvedata.com/cci?symbol=${symbol}&interval=1h&time_period=20&series_type=close`
  };

  try {
    const asset = assetNames[symbol] || symbol;
    const requests = Object.entries(endpoints).map(([key, baseUrl]) =>
      fetchWithCache(`${baseUrl}&apikey=${apiKey}`, `${symbol}-${key}`, asset)
        .then((data) => ({ key, data }))
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

    const config = {
      buyRules: {
        useRsi: process.env.RSI_BUY_THRESHOLD !== undefined,
        rsiOversold: parseFloat(process.env.RSI_BUY_THRESHOLD) || null,
        useMacd: process.env.MACD_STRATEGY_ENABLED === 'true',
        useBbands: process.env.BBAND_USE_LOWER === 'true',
        bbandsLower: true,
        useCci: process.env.CCI_BUY_THRESHOLD !== undefined,
        cciThreshold: parseFloat(process.env.CCI_BUY_THRESHOLD) || null,
        useAdx: process.env.ADX_MIN_STRENGTH !== undefined,
        adxThreshold: parseFloat(process.env.ADX_MIN_STRENGTH) || null,
        useStoch: process.env.STOCH_BUY_THRESHOLD !== undefined,
        stochOversold: parseFloat(process.env.STOCH_BUY_THRESHOLD) || null
      },
      sellRules: {
        useRsi: process.env.RSI_SELL_THRESHOLD !== undefined,
        rsiOverbought: parseFloat(process.env.RSI_SELL_THRESHOLD) || null,
        useMacd: process.env.MACD_STRATEGY_ENABLED === 'true',
        useBbands: process.env.BBAND_USE_UPPER === 'true',
        bbandsUpper: true,
        useCci: process.env.CCI_SELL_THRESHOLD !== undefined,
        cciThreshold: parseFloat(process.env.CCI_SELL_THRESHOLD) || null,
        useAdx: process.env.ADX_MIN_STRENGTH !== undefined,
        adxThreshold: parseFloat(process.env.ADX_MIN_STRENGTH) || null,
        useStoch: process.env.STOCH_SELL_THRESHOLD !== undefined,
        stochOverbought: parseFloat(process.env.STOCH_SELL_THRESHOLD) || null
      }
    };

    return res.json({ ...responseData, config });
  } catch (error) {
    console.error('Error fetching BTC indicators', error.message);
    return res.status(500).json({ error: 'Failed to fetch BTC indicators' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

if (process.env.ENABLE_CRON === 'true') {
  console.log('[INIT] Cron job enabled. Starting evaluation loop...');
  const runJob = () => {
    evaluateSignalJob().catch((err) => {
      console.error('[CRON ERROR]', err.message);
    });
  };
  runJob();
  setInterval(runJob, 12 * 60 * 60 * 1000);

  setInterval(() => {
    console.log(`[DEBUG] App is alive at ${new Date().toISOString()}`);
  }, 60 * 1000);
}
