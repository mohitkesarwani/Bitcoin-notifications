const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

// Configuration for indicators (can be moved to a config file)
const indicatorConfigs = {
  EMA: {
    period: 14,
    defaultPeriod: 14
  },
  RSI: {
    period: 14,
    defaultPeriod: 14
  },
  MACD: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    defaultFast: 12,
    defaultSlow: 26,
    defaultSignal: 9
  },
  BollingerBands: {
    period: 20,
    stdDev: 2,
    defaultPeriod: 20,
    defaultStdDev: 2
  }
};


//Helper functions for indicators
function calculateEMA(data, period) {
  //Implementation for EMA calculation (requires data array)
  if(data.length < period) return []; //Handle insufficient data
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  for(let i = period; i < data.length; i++){
    ema = (data[i] - ema) * (2 / (period + 1)) + ema;
  }
  return [ema]; //Simplified return for this example, would normally return a series
}

function calculateRSI(data, period) {
  //Implementation for RSI calculation (requires data array)
    if(data.length < period) return []; //Handle insufficient data
    return [50]; // Placeholder - Replace with actual RSI calculation
}

function calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
  //Implementation for MACD calculation (requires data array)
    if(data.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) return []; //Handle insufficient data
    return [0,0]; // Placeholder - Replace with actual MACD calculation
}

function calculateBollingerBands(data, period, stdDev) {
    //Implementation for Bollinger Bands calculation (requires data array)
    if(data.length < period) return []; //Handle insufficient data
    return [0,0,0]; // Placeholder - Replace with actual Bollinger Bands calculation
}



app.get('/indicators/:indicator', async (req, res) => {
  const indicator = req.params.indicator;
  const config = indicatorConfigs[indicator] || {};
  const periodParam = parseInt(req.query.period) || config.defaultPeriod || config.defaultFast || config.defaultSlow || config.defaultSignal || config.defaultStdDev || 14; // Default period
  const stdDevParam = parseInt(req.query.stdDev) || config.defaultStdDev || 2; //Default stdDev for Bollinger Bands
  const fastPeriodParam = parseInt(req.query.fastPeriod) || config.defaultFast || 12;
  const slowPeriodParam = parseInt(req.query.slowPeriod) || config.defaultSlow || 26;
  const signalPeriodParam = parseInt(req.query.signalPeriod) || config.defaultSignal || 9;


  try {
    const response = await axios.get('https://api.coindesk.com/v1/bpi/historical/close.json?index=USD');
    const data = Object.values(response.data.bpi).map(item => parseFloat(item));


    let result;
    switch (indicator) {
      case 'EMA':
        result = calculateEMA(data, periodParam);
        break;
      case 'RSI':
        result = calculateRSI(data, periodParam);
        break;
      case 'MACD':
        result = calculateMACD(data, fastPeriodParam, slowPeriodParam, signalPeriodParam);
        break;
      case 'BollingerBands':
        result = calculateBollingerBands(data, periodParam, stdDevParam);
        break;
      default:
        return res.status(400).json({ error: 'Invalid indicator' });
    }
    res.json({ indicator, params: { period: periodParam, stdDev: stdDevParam, fastPeriod: fastPeriodParam, slowPeriod: slowPeriodParam, signalPeriod: signalPeriodParam }, result });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch Bitcoin price data' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});