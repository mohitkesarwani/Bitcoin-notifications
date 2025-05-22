const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/15 * * * *';
const RSI_BUY = parseFloat(process.env.RSI_BUY_THRESHOLD || '30');
const RSI_SELL = parseFloat(process.env.RSI_SELL_THRESHOLD || '70');
const ENABLE_MACD = process.env.ENABLE_MACD !== 'false';
const ENABLE_BBANDS = process.env.ENABLE_BBANDS !== 'false';

async function evaluate() {
  try {
    const { data } = await axios.get(`http://localhost:${PORT}/api/btc-indicators`);
    const { rsi, macd, bbands, price } = data;
    let decision = 'HOLD';
    let logParts = [];

    if (rsi !== undefined) {
      if (rsi < RSI_BUY) {
        decision = 'BUY';
      } else if (rsi > RSI_SELL) {
        decision = 'SELL';
      }
      logParts.push(`RSI=${rsi}`);
    }

    if (ENABLE_MACD && macd) {
      const macdTrend = macd.value > macd.signal ? 'positive' : 'negative';
      logParts.push(`MACD=${macdTrend}`);
      if (macd.value > macd.signal && decision === 'SELL') {
        decision = 'HOLD';
      } else if (macd.value < macd.signal && decision === 'BUY') {
        decision = 'HOLD';
      }
      if (decision === 'HOLD') {
        if (macd.value > macd.signal && rsi < RSI_SELL) decision = 'BUY';
        if (macd.value < macd.signal && rsi > RSI_BUY) decision = 'SELL';
      }
    }

    if (ENABLE_BBANDS && bbands && price) {
      if (price < bbands.lower) {
        decision = 'BUY';
        logParts.push('BBANDS=below lower');
      } else if (price > bbands.upper) {
        decision = 'SELL';
        logParts.push('BBANDS=above upper');
      } else {
        logParts.push('BBANDS=inside');
      }
    }

    console.log(`[BTC SIGNAL] ${logParts.join(', ')} -> ${decision}`);
    // TODO: trigger notifications here
  } catch (err) {
    console.error('Indicator check failed:', err.message);
  }
}

module.exports = () => {
  cron.schedule(CRON_SCHEDULE, evaluate);
};
