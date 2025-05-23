import axios from 'axios';
import { RSI, MACD, EMA, SMA, BollingerBands, ADX, CCI, Stochastic } from 'technicalindicators';
import { evaluateSignal } from '../signalEvaluator.js';
import { sendEmail } from '../notifier.js';
import dotenv from 'dotenv';

dotenv.config();

const trackedAssets = [
  { symbol: 'BTC/USD', name: 'Bitcoin' },
  { symbol: 'SOL/USD', name: 'Solana' },
  { symbol: 'XRP/USD', name: 'XRP' },
  { symbol: 'ADA/USD', name: 'Cardano' }
];

function getSymbolPair(asset) {
  const [fsym, tsym] = asset.split('/');
  return { fsym, tsym };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOhlcv(fsym, tsym) {
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
  if (!apiKey) {
    throw new Error('CRYPTOCOMPARE_API_KEY is not configured');
  }
  const url = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=${tsym}&limit=50&api_key=${apiKey}`;
  try {
    console.log(`[API] requesting OHLCV for ${fsym}/${tsym}`);
    const res = await axios.get(url);
    console.log(`[API] successfully fetched OHLCV for ${fsym}/${tsym}`);
    if (!res.data || !res.data.Data || !Array.isArray(res.data.Data.Data)) {
      throw new Error('Invalid data from CryptoCompare');
    }
    return res.data.Data.Data;
  } catch (err) {
    console.error(`[API] failed to fetch OHLCV for ${fsym}/${tsym}: ${err.message}`);
    throw err;
  }
}

function calculateIndicators(candles) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rsiArr = RSI.calculate({ values: closes, period: 14 });
  const macdArr = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
  const ema20Arr = EMA.calculate({ period: 20, values: closes });
  const sma50Arr = SMA.calculate({ period: 50, values: closes });
  const bbArr = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  const adxArr = ADX.calculate({ close: closes, high: highs, low: lows, period: 14 });
  const cciArr = CCI.calculate({ high: highs, low: lows, close: closes, period: 20 });
  const stochArr = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });

  const price = closes[closes.length - 1];

  return {
    rsi: { values: [{ rsi: rsiArr[rsiArr.length - 1] }] },
    macd: { values: [{ macd: macdArr[macdArr.length - 1]?.MACD, macd_signal: macdArr[macdArr.length - 1]?.signal }] },
    ema20: { values: [{ ema: ema20Arr[ema20Arr.length - 1] }] },
    sma50: { values: [{ sma: sma50Arr[sma50Arr.length - 1] }] },
    bbands: { values: [{ real: price, lower_band: bbArr[bbArr.length - 1]?.lower, upper_band: bbArr[bbArr.length - 1]?.upper }] },
    stochastic: { values: [{ slow_k: stochArr[stochArr.length - 1]?.k, slow_d: stochArr[stochArr.length - 1]?.d }] },
    adx: { values: [{ adx: adxArr[adxArr.length - 1]?.adx }] },
    cci: { values: [{ cci: cciArr[cciArr.length - 1] }] }
  };
}

async function run() {
  console.log(`[CRON START] Evaluating ${trackedAssets.length} assets`);
  let buy = 0;
  let sell = 0;
  let hold = 0;

  for (const asset of trackedAssets) {
    console.log(`[CRON] Checking ${asset.name} at ${new Date().toISOString()}`);
    try {
      const { fsym, tsym } = getSymbolPair(asset.symbol);
      const candles = await fetchOhlcv(fsym, tsym);
      const indicators = calculateIndicators(candles);

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

      const result = evaluateSignal({ ...indicators, config });

      console.log(`[SIGNAL][${asset.name}] ${result.signal} - ${result.reason.join(', ')}`);

      if (result.signal === 'BUY') buy++;
      else if (result.signal === 'SELL') sell++;
      else hold++;

      const price = parseFloat(indicators.bbands.values[0].real);
      const rsi = parseFloat(indicators.rsi.values[0].rsi);
      const macdVal = parseFloat(indicators.macd.values[0].macd);
      const cci = parseFloat(indicators.cci.values[0].cci);
      const ema20 = parseFloat(indicators.ema20.values[0].ema);
      const sma50 = parseFloat(indicators.sma50.values[0].sma);
      const adx = parseFloat(indicators.adx.values[0].adx);
      const stoch = parseFloat(indicators.stochastic.values[0].slow_k);

      const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
      const subject = `[${fsym}] ${result.signal} Signal at ${timestamp} UTC`;

      const bodyLines = [
        `Signal: ${result.signal}`,
        `Price: $${price}`,
        `RSI: ${rsi}`,
        `MACD: ${macdVal}`,
        `CCI: ${cci}`,
        `EMA20: ${ema20}`,
        `SMA50: ${sma50}`,
        `ADX: ${adx}`,
        `Stochastic: ${stoch}`,
        `Reason: ${result.reason.join(', ')}`
      ];

      await sendEmail(subject, bodyLines.join('\n'));
      console.log(`[EMAIL][${asset.name}] Sent ${result.signal} notification`);
    } catch (error) {
      console.error(`[ERROR][${asset.name}] ${error.message}`);
      hold++;
    }

    await delay(1500);
  }

  console.log(`[CRON COMPLETE] ${trackedAssets.length} assets checked, ${buy} BUY, ${sell} SELL, ${hold} HOLD`);
}

export { run };
