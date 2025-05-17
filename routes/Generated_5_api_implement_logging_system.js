const express = require("express");
const app = express();
const fs = require("node:fs");
const path = require("node:path");
const { loadContextFor } = require("./context/contextLoader"); // Local file system context
const {
  loadContextFor: loadGitHubContext,
} = require("./context/githubContextLoader"); // GitHub context
const winston = require("winston");

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

app.use(express.json());

// --- Routes ---

// Fetch price data and log it
app.get("/api/price/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    // Simulate fetching price data (replace with actual API call)
    const price = await fetchPrice(symbol);
    logger.info(
      `Fetched price data: symbol=${symbol}, price=${price}, timestamp=${Date.now()}`,
    );
    res.json({ symbol, price });
  } catch (error) {
    logger.error(`Error fetching price data for ${symbol}: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch price data" });
  }
});

// Generate and log signals (including weak signals)
app.post("/api/signal", (req, res) => {
  const signal = req.body;
  const strength = signal.strength || "weak"; // Default to weak if not specified
  logger.info(
    `Generated signal: ${JSON.stringify(signal)}, strength=${strength}, timestamp=${Date.now()}`,
  );
  res.json({ message: "Signal generated" });
});

// Simulate sending email notification and log it
app.post("/api/email", (req, res) => {
  const emailData = req.body;
  logger.info(
    `Sent email notification: ${JSON.stringify(emailData)}, timestamp=${Date.now()}`,
  );
  res.json({ message: "Email sent" });
});

// Context endpoints (local and github)
app.get("/api/context/:component", async (req, res) => {
  const component = req.params.component;
  try {
    const localContext = loadContextFor(component);
    const githubContext = await loadGitHubContext(component);

    res.json({ localContext, githubContext });
  } catch (error) {
    logger.error(`Error fetching context for ${component}: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

// --- Helper functions ---

// Replace this with your actual price fetching logic
async function fetchPrice(symbol) {
  // Simulate API call with a delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  //Example - replace with actual data source
  const prices = { AAPL: 170, MSFT: 330, GOOG: 2500 };
  return prices[symbol] || null;
}

// --- Server start ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
