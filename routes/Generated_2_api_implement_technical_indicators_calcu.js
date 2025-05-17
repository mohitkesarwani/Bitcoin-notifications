const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const { loadContextFor } = require("./context/githubContextLoader"); // Use GitHub loader for demo

// Sample Bitcoin price data (replace with actual API call)
const bitcoinPrices = [
  { timestamp: 1678886400, price: 23000 },
  { timestamp: 1678972800, price: 23200 },
  { timestamp: 1679059200, price: 23500 },
  { timestamp: 1679145600, price: 23300 },
  { timestamp: 1679232000, price: 23600 },
  { timestamp: 1679318400, price: 24000 },
  { timestamp: 1679404800, price: 24200 },
  { timestamp: 1679491200, price: 24100 },
  { timestamp: 1679577600, price: 24300 },
  { timestamp: 1679664000, price: 24500 },
];

// --- INDICATOR CALCULATIONS ---

function EMA(prices, period) {
  if (prices.length < period) return null;
  let ema = prices.slice(0, period).reduce((a, b) => a + b.price, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i].price - ema) * (2 / (period + 1)) + ema;
  }
  return ema;
}

function RSI(prices, period) {
  if (prices.length < period) return null;
  let gains = [];
  let losses = [];
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i].price - prices[i - 1].price;
    if (diff > 0) gains.push(diff);
    else losses.push(Math.abs(diff));
  }
  const avgGain =
    gains.slice(gains.length - period).reduce((a, b) => a + b, 0) / period;
  const avgLoss =
    losses.slice(losses.length - period).reduce((a, b) => a + b, 0) / period ||
    0.0001; // Avoid division by zero
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function MACD(prices, shortPeriod, longPeriod, signalPeriod) {
  if (prices.length < longPeriod) return null;
  const shortEMA = EMA(prices, shortPeriod);
  const longEMA = EMA(prices, longPeriod);
  const macd = shortEMA - longEMA;
  //Simplified signal line calculation (using EMA of MACD) for brevity
  const signal = EMA(
    prices.map((p, i) => ({
      timestamp: p.timestamp,
      price: i >= longPeriod ? prices[i].price - prices[i - 1].price : 0,
    })),
    signalPeriod,
  );
  return { macd, signal };
}

function bollingerBands(prices, period, stdDev) {
  if (prices.length < period) return null;
  const avg =
    prices.slice(prices.length - period).reduce((a, b) => a + b.price, 0) /
    period;
  const sqDiffs = prices
    .slice(prices.length - period)
    .map((p) => Math.pow(p.price - avg, 2));
  const std = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / period);
  const upper = avg + stdDev * std;
  const lower = avg - stdDev * std;
  return { upper, lower, avg };
}

// --- API ROUTES ---

app.get("/context/:component", async (req, res) => {
  try {
    const context = await loadContextFor(req.params.component);
    res.send(context);
  } catch (error) {
    console.error("Error fetching context:", error);
    res.status(500).send("Error fetching context");
  }
});

app.get("/indicators/ema/:period", (req, res) => {
  const period = parseInt(req.params.period);
  if (isNaN(period) || period <= 0) {
    return res.status(400).send("Invalid period");
  }
  const ema = EMA(bitcoinPrices, period);
  res.json({ ema });
});

app.get("/indicators/rsi/:period", (req, res) => {
  const period = parseInt(req.params.period);
  if (isNaN(period) || period <= 0) {
    return res.status(400).send("Invalid period");
  }
  const rsi = RSI(bitcoinPrices, period);
  res.json({ rsi });
});

app.get("/indicators/macd/:short/:long/:signal", (req, res) => {
  const shortPeriod = parseInt(req.params.short);
  const longPeriod = parseInt(req.params.long);
  const signalPeriod = parseInt(req.params.signal);
  if (
    isNaN(shortPeriod) ||
    shortPeriod <= 0 ||
    isNaN(longPeriod) ||
    longPeriod <= 0 ||
    isNaN(signalPeriod) ||
    signalPeriod <= 0
  ) {
    return res.status(400).send("Invalid period");
  }
  const macd = MACD(bitcoinPrices, shortPeriod, longPeriod, signalPeriod);
  res.json({ macd });
});

app.get("/indicators/bollinger/:period/:stdDev", (req, res) => {
  const period = parseInt(req.params.period);
  const stdDev = parseFloat(req.params.stdDev);
  if (isNaN(period) || period <= 0 || isNaN(stdDev)) {
    return res.status(400).send("Invalid parameters");
  }
  const bands = bollingerBands(bitcoinPrices, period, stdDev);
  res.json({ bands });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
