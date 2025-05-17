const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const logger = require("./logger"); // Assuming you have a logger module

const app = express();
const port = 3000;

// Configuration (can be moved to a config file)
const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart";
const DEFAULT_INTERVAL = 15; // Minutes
let interval = DEFAULT_INTERVAL;

// Function to fetch BTC/USD price data
async function fetchBtcPriceData(days = "1") {
  try {
    const url = `${COINGECKO_API_URL}?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);
    return response.data.prices;
  } catch (error) {
    logger.error("Error fetching BTC price data:", error);
    // Implement retry logic here if needed (e.g., using exponential backoff)
    throw error; // Re-throw to be handled by calling function
  }
}

// API endpoint to get BTC price data
app.get("/api/btc-price", async (req, res) => {
  const days = req.query.days || "1"; // Default to 1 day if not specified

  try {
    const btcData = await fetchBtcPriceData(days);
    res.json(btcData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch BTC price data" });
  }
});

// Configure cron job to fetch data at the specified interval
cron.schedule(`*/${interval} * * * *`, async () => {
  try {
    const btcData = await fetchBtcPriceData("1"); // Fetch 1 day's data
    logger.info("BTC price data fetched successfully:", btcData);
    // You can store the data in a database or other persistent storage here.
  } catch (error) {
    logger.error("Cron job failed to fetch BTC price data:", error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  //Potentially log the cron job schedule here for debugging purposes
  console.log(`Cron job scheduled to run every ${interval} minutes`);
});

//Example logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    // Add other transports (e.g., file, database) as needed
  ],
});

module.exports = logger;
