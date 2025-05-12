// backend/services/ruleEngineService.js
const technicalIndicators = require('technicalindicators');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/ruleEngineConfig.json');

function loadConfig() {
  try {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading rule engine configuration:', error);
    return {};
  }
}

const config = loadConfig();

function calculateSMA(prices, period) {
  const sma = new technicalIndicators.SMA({ period, values: prices });
  return sma.result;
}

function calculateRSI(prices, period) {
  const rsi = new technicalIndicators.RSI({ period, values: prices });
  return rsi.result;
}

function calculateMACD(prices, fast, slow, signal) {
  const macd = new technicalIndicators.MACD({
    fastPeriod: fast,
    slowPeriod: slow,
    signalPeriod: signal,
    values: prices,
    SimpleMA: false,
    exponentialMA: true,
  });
  return macd.result;
}

function generateTradingSignals(prices) {
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices, 12, 26, 9);

  const lastPrice = prices[prices.length - 1];
  const lastSma50 = sma50[sma50.length - 1];
  const lastSma200 = sma200[sma200.length - 1];
  const lastRsi = rsi[rsi.length - 1];
  const lastMacd = macd[macd.length - 1];

  const conditions = {
    priceAboveSma50: lastPrice > lastSma50,
    priceAboveSma200: lastPrice > lastSma200,
    rsiAboveThreshold: lastRsi > config.rsiOverboughtThreshold,
    rsiBelowThreshold: lastRsi < config.rsiOversoldThreshold,
    macdAboveSignal: lastMacd && lastMacd.MACD > lastMacd.signal,
    macdBelowSignal: lastMacd && lastMacd.MACD < lastMacd.signal,
  };

  let buyConditionsMet = 0;
  let sellConditionsMet = 0;

  if (conditions.priceAboveSma50) buyConditionsMet++;
  if (conditions.priceAboveSma200) buyConditionsMet++;
  if (conditions.rsiBelowThreshold) buyConditionsMet++;

  if (!conditions.priceAboveSma50) sellConditionsMet++;
  if (!conditions.priceAboveSma200) sellConditionsMet++;
  if (conditions.rsiAboveThreshold) sellConditionsMet++;

  if (conditions.macdAboveSignal) buyConditionsMet++;
  if (conditions.macdBelowSignal) sellConditionsMet++;

  let signal = 'Neutral';

  if (buyConditionsMet >= 3) {
    signal = buyConditionsMet >= config.strongSignalThreshold ? 'Strong Buy' : 'Buy';
  } else if (sellConditionsMet >= 3) {
    signal = sellConditionsMet >= config.strongSignalThreshold ? 'Strong Sell' : 'Sell';
  }

  return {
    signal,
    conditions,
    lastPrice,
    lastSma50,
    lastSma200,
    lastRsi,
    lastMacd,
  };
}

module.exports = { generateTradingSignals };
