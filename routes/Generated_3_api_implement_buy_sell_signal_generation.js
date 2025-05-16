const express = require('express');
const app = express();
const port = 3000;
const contextLoaders = {
  local: require('./context/contextLoader'),
  github: require('./context/githubContextLoader'),
};

app.use(express.json());

//Define rules for Strong Buy/Sell signals
const rules = {
  strongBuy: [
    { indicator: 'RSI', value: 30, operator: '<' },
    { indicator: 'MACD', value: 0, operator: '>' },
    { indicator: 'Volume', value: 10000, operator: '>' },
    { indicator: 'SMA50', value: 'SMA200', operator: '>' },
    { indicator: 'Stochastic', value: 20, operator: '<' },
  ],
  strongSell: [
    { indicator: 'RSI', value: 70, operator: '>' },
    { indicator: 'MACD', value: 0, operator: '<' },
    { indicator: 'Volume', value: 5000, operator: '<' },
    { indicator: 'SMA50', value: 'SMA200', operator: '<' },
    { indicator: 'Stochastic', value: 80, operator: '>' },
  ],
};

//Helper function to evaluate a single rule
function evaluateRule(indicatorData, rule) {
  const value1 = parseFloat(indicatorData[rule.indicator]);
  const value2 = parseFloat(rule.value);
  if (rule.indicator === 'SMA50' && rule.value === 'SMA200'){
      return indicatorData['SMA50'] > indicatorData['SMA200'];
  }
  if (isNaN(value1) || isNaN(value2)){
      return false;
  }
  switch (rule.operator) {
    case '<': return value1 < value2;
    case '>': return value1 > value2;
    case '<=': return value1 <= value2;
    case '>=': return value1 >= value2;
    case '===': return value1 === value2;
    default: return false;
  }
}


//Function to generate signals based on rules
function generateSignals(indicatorData) {
  let buySignals = 0;
  let sellSignals = 0;

  rules.strongBuy.forEach(rule => {
    if (evaluateRule(indicatorData, rule)) {
      buySignals++;
    }
  });

  rules.strongSell.forEach(rule => {
    if (evaluateRule(indicatorData, rule)) {
      sellSignals++;
    }
  });

  const signal = {};
  if (buySignals >= 3) signal.signal = 'Strong Buy';
  if (sellSignals >= 3) signal.signal = 'Strong Sell';
  
  return signal;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const indicatorData = req.body;
    if (!indicatorData) {
      return res.status(400).json({ error: 'Missing indicator data' });
    }
    const signal = generateSignals(indicatorData);
    res.json(signal);
  } catch (error) {
    console.error('Error analyzing indicators:', error);
    res.status(500).json({ error: 'Failed to analyze indicators' });
  }
});


app.get('/api/context/:type/:source', async (req, res) => {
  const { type, source } = req.params;
  const loader = contextLoaders[source] || contextLoaders.local;
  if (source === 'github') {
    try {
      const context = await loader.loadContextFor(type);
      res.send(context);
    } catch (error) {
      console.error('Error loading GitHub context:', error);
      res.status(500).send('Error loading GitHub context');
    }
  } else {
    const context = loader.loadContextFor(type);
    res.send(context);
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});