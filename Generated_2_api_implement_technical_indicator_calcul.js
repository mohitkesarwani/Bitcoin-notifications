```javascript
const express = require('express');
const router = express.Router();
const talib = require('talib');

// Helper function to run TA-Lib indicators
async function calculateIndicator(indicator, values, options = {}) {
  try {
    const result = await talib[indicator](Object.assign({ inReal: values }, options));
    if (result.result) {
      // TA-Lib returns results as objects with arrays
      return Object.values(result.result)[0];
    }
    return null;
  } catch (error) {
    console.error(`TA-Lib error for ${indicator}:`, error);
    return null;
  }
}

// Endpoint for technical indicators
router.post('/indicators', async (req, res) => {
  const { prices, volumes } = req.body;

  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    return res.status(400).json({ error: 'Prices are required and must be a non-empty array.' });
  }

  if (!volumes || !Array.isArray(volumes) || volumes.length === 0) {
    return res.status(400).json({ error: 'Volumes are required and must be a non-empty array.' });
  }

  try {
    // Moving Average Crossover (MACrossover)
    const fastPeriod = parseInt(req.query.fastPeriod) || 12;
    const slowPeriod = parseInt(req.query.slowPeriod) || 26;

    const fastMA = await calculateIndicator('EMA', prices, { optInTimePeriod: fastPeriod });
    const slowMA = await calculateIndicator('EMA', prices, { optInTimePeriod: slowPeriod });

    let macrossover = null;
    if (fastMA && slowMA) {
      macrossover = fastMA.map((fast, index) => {
        if (index < slowPeriod - 1) return null; // Ensure we have enough data for both MAs
        return fast > slowMA[index] ? 1 : fast < slowMA[index] ? -1 : 0;
      });
    }

    // RSI (Relative Strength Index)
    const rsiPeriod = parseInt(req.query.rsiPeriod) || 14;
    const rsi = await calculateIndicator('RSI', prices, { optInTimePeriod: rsiPeriod });
    const overboughtLevel = parseInt(req.query.overboughtLevel) || 70;
    const oversoldLevel = parseInt(req.query.oversoldLevel) || 30;

    // MACD (Moving Average Convergence Divergence)
    const macdFastPeriod = parseInt(req.query.macdFastPeriod) || 12;
    const macdSlowPeriod = parseInt(req.query.macdSlowPeriod) || 26;
    const macdSignalPeriod = parseInt(req.query.macdSignalPeriod) || 9;

    const macdResult = await talib.MACD({
      inReal: prices,
      optInFastPeriod: macdFastPeriod,
      optInSlowPeriod: macdSlowPeriod,
      optInSignalPeriod: macdSignalPeriod,
    });

    const macd = macdResult.result.macd;
    const macdSignal = macdResult.result.macdSignal;
    const macdHist = macdResult.result.macdHist;


    // Bollinger Bands
    const bbPeriod = parseInt(req.query.bbPeriod) || 20;
    const bbStdDev = parseInt(req.query.bbStdDev) || 2;

    const bbandsResult = await talib.BBANDS({
      inReal: prices,
      optInTimePeriod: bbPeriod,
      optInNbDevUp: bbStdDev,
      optInNbDevDn: bbStdDev,
      optInMAType: 0, // Simple Moving Average
    });

    const upperBand = bbandsResult.result.upper;
    const middleBand = bbandsResult.result.middle;
    const lowerBand = bbandsResult.result.lower;


    // Volume Confirmation (example: simple volume increase check)
    const volumeConfirmationPeriod = parseInt(req.query.volumeConfirmationPeriod) || 5;
    let volumeConfirmation = [];
    if (volumes.length > volumeConfirmationPeriod) {
        for (let i = volumeConfirmationPeriod; i < volumes.length; i++) {
            let avgVolume = 0;
            for (let j = i - volumeConfirmationPeriod; j < i; j++) {
                avgVolume += volumes[j];
            }
            avgVolume /= volumeConfirmationPeriod;
            volumeConfirmation.push(volumes[i] > avgVolume ? 1 : 0); // 1 for confirm, 0 for not confirm
        }
    }

    res.json({
      MACrossover: macrossover,
      RSI: rsi,
      MACD: macd,
      MACD_Signal: macdSignal,
      MACD_Hist: macdHist,
      Bollinger_Upper: upperBand,
      Bollinger_Middle: middleBand,
      Bollinger_Lower: lowerBand,
      VolumeConfirmation: volumeConfirmation
    });
  } catch (error) {
    console.error('Indicator calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate indicators' });
  }
});

module.exports = router;
```