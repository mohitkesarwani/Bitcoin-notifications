const express = require('express');
const router = express.Router();

// Helper function to calculate EMA
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

// Helper function to calculate RSI
function calculateRSI(data, period) {
  let gains = [];
  let losses = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains[i] = change > 0 ? change : 0;
    losses[i] = change < 0 ? Math.abs(change) : 0;
  }

  let avgGain = calculateEMA(gains.slice(1), period);
  let avgLoss = calculateEMA(losses.slice(1), period);

  let rsi = [];
  for (let i = 0; i < avgGain.length; i++) {
    if (avgLoss[i] === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain[i] / avgLoss[i];
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

// Helper function to calculate MACD
function calculateMACD(data, shortPeriod, longPeriod, signalPeriod) {
  const emaShort = calculateEMA(data, shortPeriod);
  const emaLong = calculateEMA(data, longPeriod);

  let macdLine = [];
  for (let i = 0; i < emaShort.length; i++) {
    macdLine[i] = emaShort[i] - emaLong[i];
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);

  let histogram = [];
  for (let i = 0; i < macdLine.length; i++) {
    histogram[i] = macdLine[i] - signalLine[i];
  }

  return { macd: macdLine, signal: signalLine, histogram: histogram };
}

// Helper function to calculate Bollinger Bands
function calculateBollingerBands(data, period, stdDev) {
  let sma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    sma[i] = sum / period;
  }

  let stdDevValues = [];
  for (let i = period - 1; i < data.length; i++) {
    let sumOfSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumOfSquares += Math.pow(data[j] - sma[i], 2);
    }
    stdDevValues[i] = Math.sqrt(sumOfSquares / period);
  }

  let upperBand = [];
  let lowerBand = [];
  for (let i = period - 1; i < data.length; i++) {
    upperBand[i] = sma[i] + stdDevValues[i] * stdDev;
    lowerBand[i] = sma[i] - stdDevValues[i] * stdDev;
  }

  return { upper: upperBand, middle: sma, lower: lowerBand };
}

// Endpoint to calculate technical indicators
router.post('/indicators', (req, res) => {
  const { data, emaPeriod, rsiPeriod, macdShort, macdLong, macdSignal, bollingerPeriod, bollingerStdDev } = req.body;

  if (!data || !Array.isArray(data) || data.length < 2) {
    return res.status(400).json({ error: 'Invalid data. Provide an array of at least 2 numbers.' });
  }

  if (emaPeriod && (typeof emaPeriod !== 'number' || emaPeriod <= 0 || !Number.isInteger(emaPeriod))) {
    return res.status(400).json({ error: 'Invalid EMA period. Provide a positive integer.' });
  }

  if (rsiPeriod && (typeof rsiPeriod !== 'number' || rsiPeriod <= 0 || !Number.isInteger(rsiPeriod))) {
    return res.status(400).json({ error: 'Invalid RSI period. Provide a positive integer.' });
  }

  if (macdShort && (typeof macdShort !== 'number' || macdShort <= 0 || !Number.isInteger(macdShort))) {
    return res.status(400).json({ error: 'Invalid MACD short period. Provide a positive integer.' });
  }

  if (macdLong && (typeof macdLong !== 'number' || macdLong <= 0 || !Number.isInteger(macdLong))) {
    return res.status(400).json({ error: 'Invalid MACD long period. Provide a positive integer.' });
  }

  if (macdSignal && (typeof macdSignal !== 'number' || macdSignal <= 0 || !Number.isInteger(macdSignal))) {
    return res.status(400).json({ error: 'Invalid MACD signal period. Provide a positive integer.' });
  }

  if (
    bollingerPeriod &&
    (typeof bollingerPeriod !== 'number' || bollingerPeriod <= 0 || !Number.isInteger(bollingerPeriod))
  ) {
    return res.status(400).json({ error: 'Invalid Bollinger Bands period. Provide a positive integer.' });
  }

  if (bollingerStdDev && (typeof bollingerStdDev !== 'number' || bollingerStdDev <= 0)) {
    return res.status(400).json({ error: 'Invalid Bollinger Bands standard deviation. Provide a positive number.' });
  }

  let result = {};

  if (emaPeriod) {
    result.ema = calculateEMA(data, emaPeriod);
  }

  if (rsiPeriod) {
    result.rsi = calculateRSI(data, rsiPeriod);
  }

  if (macdShort && macdLong && macdSignal) {
    result.macd = calculateMACD(data, macdShort, macdLong, macdSignal);
  }

  if (bollingerPeriod && bollingerStdDev) {
    result.bollinger = calculateBollingerBands(data, bollingerPeriod, bollingerStdDev);
  }

  res.json(result);
});

module.exports = router;
