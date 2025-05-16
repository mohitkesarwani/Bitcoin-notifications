const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

// Configuration (move to config file in production)
const BITCOIN_API_URL = 'https://api.coindesk.com/v1/bpi/historical/close.json?'; //Example API, replace with your preferred source.

//Data Structures for caching and efficiency
let bitcoinDataCache = null;
let emaCache = null;
let rsiCache = null;
let macdCache = null;
let bbCache = null;


//Helper functions for calculations.  These could be moved to a separate file for better organization.
function EMA(series, period) {
    //Simple Exponential Moving Average calculation
    if(series.length < period) return null; //Handle insufficient data
    let ema = series.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < series.length; i++) {
        ema = (series[i] - ema) * (2 / (period + 1)) + ema;
    }
    return ema;
}

function RSI(series, period) {
  //Relative Strength Index calculation
  if(series.length < period) return null; //Handle insufficient data
    let gains = [], losses = [];
    for (let i = 1; i < series.length; i++) {
        let diff = series[i] - series[i - 1];
        if (diff >= 0) gains.push(diff);
        else losses.push(Math.abs(diff));
    }

    let avgGain = gains.slice(0,period).reduce((a,b)=> a+b,0)/period;
    let avgLoss = losses.slice(0,period).reduce((a,b)=> a+b,0)/period;

    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    let rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}


function MACD(series, fastPeriod, slowPeriod, signalPeriod){
    //Moving Average Convergence Divergence calculation
    if(series.length < slowPeriod) return null; //Handle insufficient data
    let fastEMA = EMA(series, fastPeriod);
    let slowEMA = EMA(series, slowPeriod);
    let macdLine = fastEMA - slowEMA;

    let signalLine = EMA(macdLine,signalPeriod);
    return {macdLine, signalLine};

}

function BollingerBands(series, period, stdDev){
    //Bollinger Bands calculation
    if(series.length < period) return null; //Handle insufficient data
    let mean = series.slice(-period).reduce((a,b)=> a+b,0)/period;
    let variance = series.slice(-period).map(x => Math.pow(x-mean,2)).reduce((a,b)=>a+b,0)/period;
    let std = Math.sqrt(variance);
    let upperBand = mean + stdDev * std;
    let lowerBand = mean - stdDev * std;
    return {upperBand, lowerBand, mean};
}

app.get('/bitcoin/price', async (req, res) => {
    try {
        if(bitcoinDataCache){
          res.json(bitcoinDataCache);
          return;
        }
        const response = await axios.get(BITCOIN_API_URL);
        const data = response.data.bpi;
        const timeSeries = Object.values(data).map(item => item.close);
        bitcoinDataCache = {timeSeries}; //Store the data for later use.
        res.json(bitcoinDataCache);

    } catch (error) {
        console.error("Error fetching Bitcoin price:", error);
        res.status(500).json({ error: 'Failed to fetch Bitcoin price' });
    }
});

app.get('/bitcoin/indicators', async (req, res) => {
    const { period, fastPeriod, slowPeriod, signalPeriod, stdDev } = req.query;
    //Add validation for query parameters here

    if(bitcoinDataCache === null){
      res.status(400).send("Bitcoin Price data not fetched yet. Call /bitcoin/price first");
      return;
    }

    const timeSeries = bitcoinDataCache.timeSeries;
    let indicators = {};
    indicators.ema = EMA(timeSeries, parseInt(period));
    indicators.rsi = RSI(timeSeries, parseInt(period));
    indicators.macd = MACD(timeSeries, parseInt(fastPeriod),parseInt(slowPeriod),parseInt(signalPeriod));
    indicators.bb = BollingerBands(timeSeries, parseInt(period), parseFloat(stdDev));


    res.json(indicators);
});



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});