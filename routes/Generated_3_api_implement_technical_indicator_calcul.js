// backend/utils/technicalIndicators.js
const { EMA, RSI, MACD, BollingerBands } = require('technicalindicators');

require('dotenv').config();

const emaShortPeriod = parseInt(process.env.EMA_SHORT_PERIOD || '20', 10);
const emaLongPeriod = parseInt(process.env.EMA_LONG_PERIOD || '50', 10);
const rsiPeriod = parseInt(process.env.RSI_PERIOD || '14', 10);
const macdShortPeriod = parseInt(process.env.MACD_SHORT_PERIOD || '12', 10);
const macdLongPeriod = parseInt(process.env.MACD_LONG_PERIOD || '26', 10);
const macdSignalPeriod = parseInt(process.env.MACD_SIGNAL_PERIOD || '9', 10);
const bollingerPeriod = parseInt(process.env.BOLLINGER_PERIOD || '20', 10);
const bollingerStdDev = parseInt(process.env.BOLLINGER_STD_DEV || '2', 10);

function calculateEMA(values, period) {
  const ema = new EMA({ values, period });
  return ema.result;
}

function calculateRSI(values, period) {
  const rsi = new RSI({ values, period });
  return rsi.result;
}

function calculateMACD(values, shortPeriod, longPeriod, signalPeriod) {
  const macd = new MACD({
    values,
    fastPeriod: shortPeriod,
    slowPeriod: longPeriod,
    signalPeriod,
    SimpleMA: false,
  });
  return macd.result;
}

function calculateBollingerBands(values, period, stdDev) {
  const bollinger = new BollingerBands({
    values,
    period,
    stdDev,
  });
  return bollinger.result;
}

module.exports = {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  emaShortPeriod,
  emaLongPeriod,
  rsiPeriod,
  macdShortPeriod,
  macdLongPeriod,
  macdSignalPeriod,
  bollingerPeriod,
  bollingerStdDev,
};
