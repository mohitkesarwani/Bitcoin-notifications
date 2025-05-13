const express = require('express');
const app = express();
const port = 3000;
const { loadContextFor } = require('./context/contextLoader'); // For local file system context
const { loadContextFor: loadGitHubContextFor } = require('./context/githubContextLoader'); // For GitHub repo context

// --- Financial Indicators Calculation ---
function EMA(prices, period) {
  if (prices.length < period) return [];
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * (2 / (period + 1)) + ema;
  }
  return [ema]; // Return only the latest EMA value for simplicity.  Adapt as needed.
}

function RSI(prices, period) {
  if (prices.length < period) return [];
  const deltas = prices.slice(1).map((price, index) => price - prices[index]);
  const gains = deltas.filter((delta) => delta > 0);
  const losses = deltas.filter((delta) => delta < 0).map((delta) => -delta);

  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period || 0.001; // Avoid division by zero

  let rs = avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  for (let i = period; i < deltas.length; i++) {
    avgGain = (avgGain * (period - 1) + (deltas[i] > 0 ? deltas[i] : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (deltas[i] < 0 ? -deltas[i] : 0)) / period || 0.001;
    rs = avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
  }
  return [rsi]; // Return only the latest RSI value for simplicity. Adapt as needed.
}

function MACD(prices, fastPeriod, slowPeriod, signalPeriod) {
  if (prices.length < slowPeriod) return [[], [], []];
  const fastEMA = EMA(prices, fastPeriod);
  const slowEMA = EMA(prices, slowPeriod);
  const macdLine = fastEMA[0] - slowEMA[0];

  // Simplified signal line calculation (only the latest value)
  const macdSignal = EMA(macdLine, signalPeriod);

  const macdHistogram = macdLine - macdSignal[0];
  return [macdLine, macdSignal[0], macdHistogram];
}

function bollingerBands(prices, period, stdDev) {
  if (prices.length < period) return [[], [], []];
  const sma = prices.slice(prices.length - period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = prices.slice(prices.length - period).map((price) => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdev = Math.sqrt(variance);

  const upperBand = sma + stdev * stdDev;
  const lowerBand = sma - stdev * stdDev;

  return [upperBand, sma, lowerBand];
}

// --- API Routes ---
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadGitHubContextFor(component); // Use GitHub context by default
    res.send(context);
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).send('Error fetching context');
  }
});

app.get('/indicators/ema', (req, res) => {
  const prices = req.query.prices ? req.query.prices.split(',').map(Number) : [];
  const period = parseInt(req.query.period) || 14;
  if (prices.length === 0) return res.status(400).send('Prices are required');
  const ema = EMA(prices, period);
  res.json({ ema });
});

app.get('/indicators/rsi', (req, res) => {
  const prices = req.query.prices ? req.query.prices.split(',').map(Number) : [];
  const period = parseInt(req.query.period) || 14;
  if (prices.length === 0) return res.status(400).send('Prices are required');
  const rsi = RSI(prices, period);
  res.json({ rsi });
});

app.get('/indicators/macd', (req, res) => {
  const prices = req.query.prices ? req.query.prices.split(',').map(Number) : [];
  const fastPeriod = parseInt(req.query.fastPeriod) || 12;
  const slowPeriod = parseInt(req.query.slowPeriod) || 26;
  const signalPeriod = parseInt(req.query.signalPeriod) || 9;
  if (prices.length === 0) return res.status(400).send('Prices are required');
  const [macd, signal, histogram] = MACD(prices, fastPeriod, slowPeriod, signalPeriod);
  res.json({ macd, signal, histogram });
});

app.get('/indicators/bollingerBands', (req, res) => {
  const prices = req.query.prices ? req.query.prices.split(',').map(Number) : [];
  const period = parseInt(req.query.period) || 20;
  const stdDev = parseFloat(req.query.stdDev) || 2;
  if (prices.length === 0) return res.status(400).send('Prices are required');
  const [upper, middle, lower] = bollingerBands(prices, period, stdDev);
  res.json({ upper, middle, lower });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
