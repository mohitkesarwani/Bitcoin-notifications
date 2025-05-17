const express = require("express");
const app = express();
const port = 3000;
const { loadContextFor } = require("./context/contextLoader"); //For demonstration - replace with your actual indicator calculation

app.use(express.json());

// Sample technical indicator calculations (REPLACE WITH YOUR ACTUAL LOGIC)
function calculateIndicators(data) {
  //Simulate calculations - replace with your actual indicator calculations.
  const random = Math.random();
  return {
    rsi: random > 0.7 ? "Overbought" : random < 0.3 ? "Oversold" : "Neutral",
    macd: random > 0.6 ? "Bullish" : random < 0.4 ? "Bearish" : "Neutral",
    stochRSI:
      random > 0.8 ? "Overbought" : random < 0.2 ? "Oversold" : "Neutral",
    bollingerBands:
      random > 0.7 ? "Overbought" : random < 0.3 ? "Oversold" : "Neutral",
    adx: random > 0.5 ? "Strong Trend" : "Weak Trend",
    volume: random > 0.6 ? "High Volume" : "Low Volume",
  };
}

//Signal Generation Logic
function generateSignal(indicators) {
  const buyConditions = [
    indicators.rsi === "Oversold",
    indicators.macd === "Bullish",
    indicators.stochRSI === "Oversold",
    indicators.bollingerBands === "Oversold",
    indicators.adx === "Strong Trend" && indicators.volume === "High Volume",
  ];

  const sellConditions = [
    indicators.rsi === "Overbought",
    indicators.macd === "Bearish",
    indicators.stochRSI === "Overbought",
    indicators.bollingerBands === "Overbought",
    indicators.adx === "Strong Trend" && indicators.volume === "High Volume",
  ];

  const buyCount = buyConditions.filter((condition) => condition).length;
  const sellCount = sellConditions.filter((condition) => condition).length;

  if (buyCount >= 3) return "Strong Buy";
  if (sellCount >= 3) return "Strong Sell";
  return "Neutral";
}

app.post("/api/signal", (req, res) => {
  try {
    const data = req.body; //Get market data from request body

    //Input validation (Add more robust validation as needed)
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Market data is required." });
    }

    const indicators = calculateIndicators(data);
    const signal = generateSignal(indicators);
    res.json({ signal, indicators });
  } catch (error) {
    console.error("Error generating signal:", error);
    res.status(500).json({ error: "Failed to generate signal." });
  }
});

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  const context = await loadContextFor(component);
  res.send(context);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
