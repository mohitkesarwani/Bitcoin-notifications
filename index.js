import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import {
  RSI,
  MACD,
  EMA,
  SMA,
  BollingerBands,
  ADX,
  CCI,
  Stochastic
} from 'technicalindicators';
import { run as evaluateSignalJob } from './cron/evaluateAndLog.js';

// Simple in-memory cache to avoid excessive API requests
const cache = {};

/**
 * Fetch data from a URL with caching.
 * @param {string} url - The API endpoint including query params.
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
    console.log(`[API]${prefix}fetching ${key} from CryptoCompare`);
    const response = await axios.get(url);
    console.log(`[API]${prefix}successfully fetched ${key}`);
    cache[key] = { data: response.data, timestamp: now };
    return response.data;
  } catch (err) {
    const prefix = context ? `[${context}] ` : '';
    console.error(`[API]${prefix}failed to fetch ${key}: ${err.message}`);
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

function getSymbolPair(asset) {
  const [fsym, tsym] = asset.split('/');
  return { fsym, tsym };
}

async function fetchOhlcv(fsym, tsym) {
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
  if (!apiKey) {
    throw new Error('CRYPTOCOMPARE_API_KEY is not configured');
  }
  const url = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=${tsym}&limit=50&api_key=${apiKey}`;
  const data = await fetchWithCache(url, `${fsym}${tsym}-ohlc`, `${fsym}/${tsym}`);
  if (!data || !data.Data || !Array.isArray(data.Data.Data)) {
    throw new Error('Invalid data from CryptoCompare');
  }
  return data.Data.Data;
}

function calculateIndicators(candles) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rsiArr = RSI.calculate({ values: closes, period: 14 });
  const macdArr = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const ema20Arr = EMA.calculate({ period: 20, values: closes });
  const sma50Arr = SMA.calculate({ period: 50, values: closes });
  const bbArr = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  const adxArr = ADX.calculate({ close: closes, high: highs, low: lows, period: 14 });
  const cciArr = CCI.calculate({ high: highs, low: lows, close: closes, period: 20 });
  const stochArr = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });

  const price = closes[closes.length - 1];

  return {
    rsi: { values: [{ rsi: rsiArr[rsiArr.length - 1] }] },
    macd: {
      values: [
        {
          macd: macdArr[macdArr.length - 1]?.MACD,
          macd_signal: macdArr[macdArr.length - 1]?.signal
        }
      ]
    },
    ema20: { values: [{ ema: ema20Arr[ema20Arr.length - 1] }] },
    sma50: { values: [{ sma: sma50Arr[sma50Arr.length - 1] }] },
    bbands: {
      values: [
        {
          real: price,
          lower_band: bbArr[bbArr.length - 1]?.lower,
          upper_band: bbArr[bbArr.length - 1]?.upper
        }
      ]
    },
    stochastic: {
      values: [
        { slow_k: stochArr[stochArr.length - 1]?.k, slow_d: stochArr[stochArr.length - 1]?.d }
      ]
    },
    adx: { values: [{ adx: adxArr[adxArr.length - 1]?.adx }] },
    cci: { values: [{ cci: cciArr[cciArr.length - 1] }] }
  };
}

const app = express();
const port = process.env.PORT || 3000;


app.get('/api/btc-data', async (req, res) => {
  try {
    const { fsym, tsym } = getSymbolPair('BTC/USD');
    const candles = await fetchOhlcv(fsym, tsym);
    const closes = candles.map((c) => c.close);
    const price = closes[closes.length - 1];
    const rsiArr = RSI.calculate({ values: closes, period: 14 });
    const rsi = rsiArr[rsiArr.length - 1];

    return res.json({ price, rsi });
  } catch (error) {
    console.error('Error fetching BTC data', error.message);
    return res.status(500).json({ error: 'Failed to fetch BTC data' });
  }
});

app.get('/api/btc-indicators', async (req, res) => {
  const symbol = req.query.symbol || 'BTC/USD';

  try {
    const { fsym, tsym } = getSymbolPair(symbol);
    const candles = await fetchOhlcv(fsym, tsym);
    const indicators = calculateIndicators(candles);

    const responseData = { ...indicators };

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

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

let cronInterval;
let aliveInterval;

function shutdown() {
  console.log('[SHUTDOWN] Received termination signal, closing server');
  clearInterval(aliveInterval);
  clearInterval(cronInterval);
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
  // Fallback exit if close never happens
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

if (process.env.ENABLE_CRON === 'true') {
  console.log('[INIT] Cron job enabled. Starting evaluation loop...');
  const runJob = () => {
    evaluateSignalJob().catch((err) => {
      console.error('[CRON ERROR]', err.message);
    });
  };
  runJob();
  cronInterval = setInterval(runJob, 30 * 60 * 1000);

  aliveInterval = setInterval(() => {
    console.log(`[DEBUG] App is alive at ${new Date().toISOString()}`);
  }, 60 * 1000);
}
