const express = require('express');
const app = express();
const port = 3000;
const { loadContextFor } = require('./context/contextLoader'); // Local file system
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader'); // GitHub repo

app.use(express.json());

// Define signal generation rules
const signalRules = {
  'Strong Buy': [
    { indicator: 'RSI', value: 30, operator: '<=' },
    { indicator: 'MACD', value: 0, operator: '>=' },
    { indicator: 'Volume', value: 10000, operator: '>=' },
    { indicator: 'SMA50', value: 200, operator: '>=' },
    { indicator: 'EMA200', value: 180, operator: '>=' },
  ],
  'Strong Sell': [
    { indicator: 'RSI', value: 70, operator: '>=' },
    { indicator: 'MACD', value: 0, operator: '<=' },
    { indicator: 'Volume', value: 1000, operator: '<=' },
    { indicator: 'SMA50', value: 200, operator: '<=' },
    { indicator: 'EMA200', value: 180, operator: '<=' },
  ],
};

// Helper function to evaluate a single rule
function evaluateRule(indicatorData, rule) {
  const value = indicatorData[rule.indicator];
  if (value === undefined) return false; // Handle missing indicator data

  switch (rule.operator) {
    case '<=':
      return value <= rule.value;
    case '>=':
      return value >= rule.value;
    case '<':
      return value < rule.value;
    case '>':
      return value > rule.value;
    case '==':
      return value == rule.value;
    default:
      return false;
  }
}

// Function to generate signals
function generateSignals(indicatorData) {
  const signals = {};
  for (const [signalType, rules] of Object.entries(signalRules)) {
    let metConditions = 0;
    for (const rule of rules) {
      if (evaluateRule(indicatorData, rule)) {
        metConditions++;
      }
    }
    signals[signalType] = metConditions >= 3; // Strong signal if at least 3 conditions met
    signals[`Weak ${signalType}`] = metConditions > 0 && metConditions < 3; //Weak signal if 1 or 2 conditions are met
  }
  return signals;
}

app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadContextFor(component);
    res.send(context);
  } catch (error) {
    console.error('Error loading local context:', error);
    res.status(500).send('Error loading context');
  }
});

app.get('/githubContext/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadGitHubContext(component);
    res.send(context);
  } catch (error) {
    console.error('Error loading GitHub context:', error);
    res.status(500).send('Error loading context');
  }
});

app.post('/signals', (req, res) => {
  const indicatorData = req.body;
  if (!indicatorData) return res.status(400).send('Missing indicator data');

  const signals = generateSignals(indicatorData);
  console.log('Generated signals:', signals);
  res.send(signals);
});

app.listen(port, () => {
  console.log(`Rule Engine API listening at http://localhost:${port}`);
});
