const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const { loadContextFor } = require("./context/contextLoader"); // Use local context loader if needed

const app = express();
const port = 3000;

// Configuration (move to .env or config file in production)
const apiUrl =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"; // CoinGecko API
const updateInterval = process.env.UPDATE_INTERVAL || 15; // minutes

//Data Storage
let btcData = {};

//Fetch BTC data
async function fetchBTCData() {
  try {
    const response = await axios.get(apiUrl);
    const prices = response.data.prices;
    //Extract Open, High, Low, Close, Volume from the last day's data
    const lastDayData = prices.slice(-1)[0];
    const [timestamp, open] = lastDayData;
    const high = prices.reduce((max, [_, price]) => Math.max(max, price), open);
    const low = prices.reduce((min, [_, price]) => Math.min(min, price), open);
    const close = prices[prices.length - 1][1];
    const volume = 0; // CoinGecko doesn't directly provide daily volume in this endpoint

    btcData = {
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    };
    console.log("BTC data updated successfully:", btcData);
  } catch (error) {
    console.error("Error fetching BTC data:", error);
    //Handle error, maybe use fallback data or set btcData to null
  }
}

//Schedule data update
cron.schedule(`*/${updateInterval} * * * *`, fetchBTCData);

//Initial data fetch
fetchBTCData();

//Routes
app.get("/btc", (req, res) => {
  res.json(btcData);
});

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  const context = await loadContextFor(component);
  res.send(context);
});

//Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
