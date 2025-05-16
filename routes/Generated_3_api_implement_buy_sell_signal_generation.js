const express = require('express');
const app = express();
const port = 3000;
const contextLoaders = {
  local: require('./context/contextLoader'),
  github: require('./context/githubContextLoader'),
};

app.use(express.json());

//Rule Engine
const ruleEngine = (indicators) => {
  const signals = [];
  //Example Rules -  Replace with your actual technical analysis rules
  if (indicators.RSI < 30 && indicators.MACD > 0) {
    signals.push({ symbol: 'AAPL', signal: 'Strong Buy', reason: 'RSI below 30 and MACD positive' });
  }
  if (indicators.RSI > 70 && indicators.MACD < 0) {
    signals.push({ symbol: 'AAPL', signal: 'Strong Sell', reason: 'RSI above 70 and MACD negative' });
  }
  if (indicators.SMA50 > indicators.SMA200) {
    signals.push({symbol: 'AAPL', signal: 'Buy', reason: 'SMA50 above SMA200'});
  }
    if (indicators.SMA50 < indicators.SMA200) {
    signals.push({symbol: 'AAPL', signal: 'Sell', reason: 'SMA50 below SMA200'});
  }

  return signals;
};


app.post('/api/analyze', async (req, res) => {
  try {
    const { indicators, contextType = 'local', component } = req.body;

    if (!indicators) {
      return res.status(400).json({ error: 'Missing indicators' });
    }

    if (!contextType || !['local', 'github'].includes(contextType)) {
      return res.status(400).json({ error: 'Invalid context type. Choose "local" or "github".' });
    }

    let context;
    if (contextType === 'local' && component) {
        context = contextLoaders[contextType].loadContextFor(component)
    } else if (contextType === 'github' && component) {
        context = await contextLoaders[contextType].loadContextFor(component);
    } else {
        return res.status(400).json({ error: 'Context type requires component for local and github.'});
    }

    console.log(`Context: ${context}`); //Log Context

    const signals = ruleEngine(indicators);
    signals.forEach(signal => console.log(signal)); // Log all signals
    res.json({ signals });
  } catch (error) {
    console.error('Error during analysis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});