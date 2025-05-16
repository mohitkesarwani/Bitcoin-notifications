const express = require('express');
const app = express();
const port = 3000;
const { loadContextFor } = require('./context/contextLoader'); // For local context
const { loadContextFor: loadGitHubContext } = require('./context/githubContextLoader'); // For GitHub context


app.use(express.json());

// Sample technical indicator data (replace with your actual data source)
let technicalIndicators = {
  RSI: 70,
  MACD: 20,
  SMA: 150,
  EMA: 160,
  Volume: 10000,
};

// Function to generate buy/sell signals
function generateSignals(indicators) {
  const conditions = [
    indicators.RSI > 70, // Overbought
    indicators.MACD > 0, // Bullish
    indicators.SMA < indicators.EMA, // Bullish crossover
    indicators.Volume > 5000, // High volume
    indicators.RSI < 30, //Oversold (Sell signal)
  ];

  const buyConditions = conditions.slice(0,4);
  const sellConditions = [conditions[4]];

  const buyCount = buyConditions.filter(c => c).length;
  const sellCount = sellConditions.filter(c => c).length;


  let signal = '';
  if (buyCount >= 3) {
    signal = 'Strong Buy';
  } else if (sellCount >=1 && buyCount < 3){
    signal = 'Strong Sell';
  } else {
    signal = 'Neutral';
  }
  return signal;
}


// API endpoint to get buy/sell signals
app.get('/signals', async (req, res) => {
  try {
    const signal = generateSignals(technicalIndicators);
    res.json({ signal });
  } catch (error) {
    console.error('Error generating signals:', error);
    res.status(500).json({ error: 'Failed to generate signals' });
  }
});


// API endpoint to update technical indicators (POST)
app.post('/indicators', (req, res) => {
    // Input validation
    const { RSI, MACD, SMA, EMA, Volume } = req.body;
    if (!RSI || !MACD || !SMA || !EMA || !Volume) {
      return res.status(400).json({ error: 'Missing required indicators' });
    }
    technicalIndicators = { RSI, MACD, SMA, EMA, Volume };
    res.json({ message: 'Indicators updated successfully' });
});


//Load Context from local file system or GitHub
app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const localContext = loadContextFor(component);
    const gitHubContext = await loadGitHubContext(component);

    res.json({localContext, gitHubContext});

  } catch (err) {
    console.error("Error loading context", err)
    res.status(500).json({ error: 'Failed to load context' });
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});