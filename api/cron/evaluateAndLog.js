import axios from 'axios';
import { RSI, MACD, EMA, SMA, BollingerBands, ADX, CCI, Stochastic } from 'technicalindicators';
import { evaluateSignal } from '../signalEvaluator.js';
import { sendEmail } from '../notifier.js';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

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
    rsi: rsiArr[rsiArr.length - 1],
    macd: macdArr[macdArr.length - 1]?.MACD,
    macdSignal: macdArr[macdArr.length - 1]?.signal,
    previousMacd: macdArr[macdArr.length - 2]?.MACD,
    previousSignal: macdArr[macdArr.length - 2]?.signal,
    ema20: ema20Arr[ema20Arr.length - 1],
    sma50: sma50Arr[sma50Arr.length - 1],
    bbands: { real: price, lower: bbArr[bbArr.length - 1]?.lower, upper: bbArr[bbArr.length - 1]?.upper },
    stochasticK: stochArr[stochArr.length - 1]?.k,
    stochasticD: stochArr[stochArr.length - 1]?.d,
    adx: adxArr[adxArr.length - 1]?.adx,
    cci: cciArr[cciArr.length - 1]
  };
}

async function run(config = {}) {
  if (!Object.keys(config).length) {
    config = {
      rsiBuyThreshold: Number(process.env.RSI_BUY_THRESHOLD || 30),
      rsiSellThreshold: Number(process.env.RSI_SELL_THRESHOLD || 70),
      adxMinStrength: Number(process.env.ADX_MIN_STRENGTH || 20),
      cciBuyThreshold: Number(process.env.CCI_BUY_THRESHOLD || 100),
      cciSellThreshold: Number(process.env.CCI_SELL_THRESHOLD || -100),
      stochBuyThreshold: Number(process.env.STOCH_BUY_THRESHOLD || 20),
      stochSellThreshold: Number(process.env.STOCH_SELL_THRESHOLD || 80),
      useRsi: process.env.USE_RSI !== 'false',
      useMacd: process.env.USE_MACD !== 'false',
      useAdx: process.env.USE_ADX !== 'false',
      useCci: process.env.USE_CCI !== 'false',
      useStoch: process.env.USE_STOCH !== 'false'
    };
  }
  try {
    console.log(`[CRON START] Evaluating ${trackedAssets.length} assets`);
    let buy = 0;
    let sell = 0;
    let hold = 0;
    const results = [];

  for (const asset of trackedAssets) {
    console.log(`[CRON] Checking ${asset.name} at ${new Date().toISOString()}`);
    try {
      const { fsym, tsym } = getSymbolPair(asset.symbol);
      const candles = await fetchOhlcv(fsym, tsym);
      const indicators = calculateIndicators(candles);

      const result = evaluateSignal({
        rsi: indicators.rsi,
        macd: indicators.macd,
        macdSignal: indicators.macdSignal,
        adx: indicators.adx,
        cci: indicators.cci,
        stochasticK: indicators.stochasticK,
        stochasticD: indicators.stochasticD,
        price: indicators.bbands.real,
        previousMacd: indicators.previousMacd,
        previousSignal: indicators.previousSignal
      }, config);

      console.log(`[SIGNAL][${asset.name}] ${result.signal} - ${result.reason.join(', ')}`);

      if (result.signal === 'BUY') buy++;
      else if (result.signal === 'SELL') sell++;
      else hold++;

      const price = indicators.bbands.real;
      const rsi = indicators.rsi;
      const macdVal = indicators.macd;
      const cci = indicators.cci;
      const ema20 = indicators.ema20;
      const sma50 = indicators.sma50;
      const adx = indicators.adx;
      const stoch = indicators.stochasticK;

      results.push({
        asset: fsym,
        signal: result.signal,
        reason: result.reason,
        price,
        indicators: {
          rsi,
          macd: macdVal,
          adx,
          cci,
          ema20,
          sma50,
          stoch
        }
      });
    } catch (error) {
      console.error(`[ERROR][${asset.name}] ${error.message}`);
      hold++;
    }

    await delay(1500);
  }

    const combinedText = results
      .map((r) =>
        [
          `🚨 ${r.asset} SIGNAL: ${r.signal}`,
          `Price: $${r.price}`,
          `RSI: ${r.indicators.rsi} | MACD: ${r.indicators.macd} | ADX: ${r.indicators.adx} | CCI: ${r.indicators.cci}`,
          `Reason: ${r.reason.join(', ')}`
        ].join('\n')
      )
      .join('\n\n');

    const subject = `Crypto Signal Summary at ${new Date().toISOString()}`;

    console.log('[EMAIL] Combined signal summary:\n', combinedText);

    await sendEmail(subject, combinedText);

    console.log(`[CRON COMPLETE] ${trackedAssets.length} assets checked, ${buy} BUY, ${sell} SELL, ${hold} HOLD`);
  } catch (err) {
    console.error(`[CRON ERROR] ${err.message}`);
    throw err;
  }
}

export { run };

if (process.argv[1] && process.argv[1].includes('evaluateAndLog.js')) {
  run().catch((err) => {
    console.error('[UNCAUGHT CRON ERROR]', err);
  });
}
