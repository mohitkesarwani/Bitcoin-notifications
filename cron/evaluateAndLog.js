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
  const res = await axios.get(url);
  if (!res.data || !res.data.Data || !Array.isArray(res.data.Data.Data)) {
    throw new Error('Invalid data from CryptoCompare');
  }
  return res.data.Data.Data;
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
      const result = evaluateSignal(indicators);
      console.log(`[SIGNAL][${asset.name}] ${result.signal} - ${result.reason.join(', ')}`);

      if (result.signal === 'BUY') buy++;
      else if (result.signal === 'SELL') sell++;
      else hold++;

      if (['BUY', 'SELL'].includes(result.signal)) {
        await sendEmail(`[${asset.name}] ${result.signal}`, result.reason.join('\n'));
        console.log(`[EMAIL][${asset.name}] Sent ${result.signal} notification`);
      }
    } catch (error) {
      console.error(`[CRON ERROR][${asset.name}] ${error.message}`);
      hold++;
    }

    await delay(1500);
  }

  console.log(`[CRON COMPLETE] ${trackedAssets.length} assets checked, ${buy} BUY, ${sell} SELL, ${hold} HOLD`);
}

export { run };
