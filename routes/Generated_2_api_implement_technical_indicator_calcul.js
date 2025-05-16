const express = require('express');
const app = express();
const port = 3000;
const { loadContextFor } = require('./context/contextLoader'); //Local file loader
const { loadContextFor: loadGithubContextFor } = require('./context/githubContextLoader'); //Github file loader

//Technical Indicators Calculation
function SMA(data, period) {
    if (data.length < period) return null;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

function EMA(data, period, smoothing = 2) {
    if (data.length < period) return null;
    let ema = SMA(data, period);
    for (let i = period; i < data.length; i++) {
        ema = (data[i] * (smoothing / (1 + period))) + (ema * (1 - (smoothing / (1 + period))));
    }
    return ema;
}

function RSI(data, period) {
    if (data.length < period) return null;
    const deltas = data.slice(1).map((val, i) => val - data[i]);
    const gains = deltas.filter(delta => delta > 0);
    const losses = deltas.filter(delta => delta < 0).map(delta => -delta);
    const avgGain = SMA(gains, period);
    const avgLoss = SMA(losses, period);
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}


function MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (data.length < slowPeriod) return null;
    const fastEMA = EMA(data, fastPeriod);
    const slowEMA = EMA(data, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    const signalLine = EMA(data.map(()=> fastEMA - slowEMA), signalPeriod); //Simplified signal line calculation using previous macd values.
    return { macdLine, signalLine };
}

function BollingerBands(data, period = 20, stdDev = 2) {
    if (data.length < period) return null;
    const sma = SMA(data, period);
    const deviations = data.slice(-period).map(val => val - sma);
    const variance = deviations.reduce((a, b) => a + b * b, 0) / period;
    const standardDeviation = Math.sqrt(variance);
    const upperBand = sma + stdDev * standardDeviation;
    const lowerBand = sma - stdDev * standardDeviation;
    return { sma, upperBand, lowerBand };
}


// API Routes
app.get('/api/context/:component', async (req, res) => {
    const component = req.params.component;
    try {
      const context = await loadContextFor(component);
      res.json({ context });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.get('/api/github/context/:component', async (req, res) => {
    const component = req.params.component;
    try {
        const context = await loadGithubContextFor(component);
        res.json({ context });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/indicators/ema', (req, res) => {
    const data = req.query.data ? req.query.data.split(',').map(Number) : [];
    const period = parseInt(req.query.period) || 10;
    const ema = EMA(data, period);
    res.json({ ema });
});

app.get('/api/indicators/rsi', (req, res) => {
    const data = req.query.data ? req.query.data.split(',').map(Number) : [];
    const period = parseInt(req.query.period) || 14;
    const rsi = RSI(data, period);
    res.json({ rsi });
});

app.get('/api/indicators/macd', (req, res) => {
    const data = req.query.data ? req.query.data.split(',').map(Number) : [];
    const fastPeriod = parseInt(req.query.fastPeriod) || 12;
    const slowPeriod = parseInt(req.query.slowPeriod) || 26;
    const signalPeriod = parseInt(req.query.signalPeriod) || 9;
    const macd = MACD(data, fastPeriod, slowPeriod, signalPeriod);
    res.json({ macd });
});

app.get('/api/indicators/bollingerBands', (req, res) => {
    const data = req.query.data ? req.query.data.split(',').map(Number) : [];
    const period = parseInt(req.query.period) || 20;
    const stdDev = parseFloat(req.query.stdDev) || 2;
    const bb = BollingerBands(data, period, stdDev);
    res.json({ bb });
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});