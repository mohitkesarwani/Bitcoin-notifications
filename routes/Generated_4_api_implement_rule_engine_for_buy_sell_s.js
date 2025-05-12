// backend/utils/technicalAnalysis.js
const talib = require('talib');

const calculateMA = (values, period) => {
  const result = talib.MA({ inReal: values, optInTimePeriod: period });
  return result.result.outReal;
};

const calculateRSI = (values, period) => {
  const result = talib.RSI({ inReal: values, optInTimePeriod: period });
  return result.result.outReal;
};

const calculateMACD = (values, fastPeriod, slowPeriod, signalPeriod) => {
  const result = talib.MACD({
    inReal: values,
    optInFastPeriod: fastPeriod,
    optInSlowPeriod: slowPeriod,
    optInSignalPeriod: signalPeriod,
  });
  return { macd: result.result.outMACD, signal: result.result.outMACDSignal, hist: result.result.outMACDHist };
};

const calculateBBANDS = (values, period, stdDevUp, stdDevDown) => {
  const result = talib.BBANDS({
    inReal: values,
    optInTimePeriod: period,
    optInNbDevUp: stdDevUp,
    optInNbDevDn: stdDevDown,
  });
  return {
    upper: result.result.outRealUpperBand,
    middle: result.result.outRealMiddleBand,
    lower: result.result.outRealLowerBand,
  };
};

module.exports = { calculateMA, calculateRSI, calculateMACD, calculateBBANDS };

// backend/utils/signalGenerator.js
const { calculateMA, calculateRSI, calculateMACD, calculateBBANDS } = require('./technicalAnalysis');

const generateSignals = (
  data,
  shortPeriod = 20,
  longPeriod = 50,
  rsiPeriod = 14,
  macdFastPeriod = 12,
  macdSlowPeriod = 26,
  macdSignalPeriod = 9,
  bbPeriod = 20,
  bbStdDev = 2
) => {
  const closes = data.map((item) => item.close);
  const volumes = data.map((item) => item.volume);

  const shortMA = calculateMA(closes, shortPeriod);
  const longMA = calculateMA(closes, longPeriod);
  const rsi = calculateRSI(closes, rsiPeriod);
  const macd = calculateMACD(closes, macdFastPeriod, macdSlowPeriod, macdSignalPeriod);
  const bbands = calculateBBANDS(closes, bbPeriod, bbStdDev, bbStdDev);

  const signals = [];
  let buyConditionsMet = 0;
  let sellConditionsMet = 0;

  for (let i = 1; i < closes.length; i++) {
    const currentIndex = i;

    // MA Crossover
    if (shortMA[currentIndex] > longMA[currentIndex] && shortMA[currentIndex - 1] <= longMA[currentIndex - 1]) {
      buyConditionsMet++;
    } else if (shortMA[currentIndex] < longMA[currentIndex] && shortMA[currentIndex - 1] >= longMA[currentIndex - 1]) {
      sellConditionsMet++;
    }

    // RSI Overbought/Oversold
    if (rsi[currentIndex] < 30) {
      buyConditionsMet++;
    } else if (rsi[currentIndex] > 70) {
      sellConditionsMet++;
    }

    // MACD Crossover
    if (
      macd.macd[currentIndex] > macd.signal[currentIndex] &&
      macd.macd[currentIndex - 1] <= macd.signal[currentIndex - 1]
    ) {
      buyConditionsMet++;
    } else if (
      macd.macd[currentIndex] < macd.signal[currentIndex] &&
      macd.macd[currentIndex - 1] >= macd.signal[currentIndex - 1]
    ) {
      sellConditionsMet++;
    }

    // Bollinger Bands Breach
    if (closes[currentIndex] > bbands.upper[currentIndex]) {
      sellConditionsMet++;
    } else if (closes[currentIndex] < bbands.lower[currentIndex]) {
      buyConditionsMet++;
    }

    // Volume Confirmation (Optional, requires additional logic to define significant volume increase)
    // Example: if (volumes[currentIndex] > someThreshold) buyConditionsMet++;

    let signal = 'Neutral';
    if (buyConditionsMet >= 3) {
      signal = 'Strong Buy';
    } else if (sellConditionsMet >= 3) {
      signal = 'Strong Sell';
    }
    signals.push({
      timestamp: data[i].timestamp,
      signal: signal,
    });
    buyConditionsMet = 0;
    sellConditionsMet = 0;
  }

  return signals;
};

module.exports = { generateSignals };

// backend/routes/index.js
const express = require('express');
const router = express.Router();
const { generateSignals } = require('../utils/signalGenerator'); // Ensure correct path

router.post('/analyze', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid data format.  Expected an array of objects with timestamp, close, and volume.' });
    }

    const signals = generateSignals(data);
    res.json({ signals });
  } catch (error) {
    console.error('Error analyzing data:', error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

module.exports = router;
