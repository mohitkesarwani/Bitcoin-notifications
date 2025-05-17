const express = require("express");
const app = express();
const port = 3000;
const { loadContextFor } = require("./context/contextLoader"); // Use local file system context for simplicity in this example.  Replace with githubContextLoader if needed.

// Sample data (replace with your actual indicator calculations)
const indicators = {
  rsi: 70,
  macd: 20,
  bollingerBands: -2,
  stochasticRSI: 90,
  volume: 100000, // High volume
};

// Function to generate buy/sell signals
function generateSignal(indicators, volumeThreshold = 50000) {
  let buyCount = 0;
  let sellCount = 0;

  // Buy conditions
  if (indicators.rsi > 70) buyCount++;
  if (indicators.macd > 0) buyCount++;
  if (indicators.bollingerBands > 0) buyCount++;
  if (indicators.stochasticRSI > 80) buyCount++;
  if (indicators.volume > volumeThreshold) buyCount++; // Volume confirmation

  // Sell conditions (inverse of buy conditions)
  if (indicators.rsi < 30) sellCount++;
  if (indicators.macd < 0) sellCount++;
  if (indicators.bollingerBands < 0) sellCount++;
  if (indicators.stochasticRSI < 20) sellCount++;
  if (indicators.volume < volumeThreshold) sellCount++; // Volume confirmation

  let signal = "";
  if (buyCount >= 3) signal = "Strong Buy";
  else if (sellCount >= 3) signal = "Strong Sell";
  else signal = "Neutral";

  return signal;
}

app.use(express.json());

app.get("/signal", (req, res) => {
  try {
    const signal = generateSignal(indicators);
    res.json({ signal });
  } catch (error) {
    console.error("Error generating signal:", error);
    res.status(500).json({ error: "Failed to generate signal" });
  }
});

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadContextFor(component); //Use githubContextLoader for GitHub integration.
    res.send(context);
  } catch (error) {
    console.error("Error loading context:", error);
    res.status(500).send("Failed to load context");
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
