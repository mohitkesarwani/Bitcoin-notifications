const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const { loadContextFor } = require("./context/githubContextLoader"); // Use GitHub loader for demonstration
const technicalIndicators = require("technicalindicators");

app.use(express.json());

// Configuration for indicators (make these configurable from request or config file)
const indicatorConfig = {
  ema: { period: 12, default: 12 },
  rsi: { period: 14, default: 14 },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    defaultFast: 12,
    defaultSlow: 26,
    defaultSignal: 9,
  },
  bollingerBands: {
    period: 20,
    stdDev: 2,
    defaultPeriod: 20,
    defaultStdDev: 2,
  },
};

// Helper function to calculate indicators
async function calculateIndicators(prices, config) {
  const ema = technicalIndicators.EMA.calculate({
    period: config.ema.period || config.ema.default,
    values: prices,
  });
  const rsi = technicalIndicators.RSI.calculate({
    period: config.rsi.period || config.rsi.default,
    values: prices,
  });
  const macd = technicalIndicators.MACD.calculate({
    fastPeriod: config.macd.fastPeriod || config.macd.defaultFast,
    slowPeriod: config.macd.slowPeriod || config.macd.defaultSlow,
    signalPeriod: config.macd.signalPeriod || config.macd.defaultSignal,
    values: prices,
  });
  const bb = technicalIndicators.BollingerBands.calculate({
    period: config.bollingerBands.period || config.bollingerBands.defaultPeriod,
    stdDev: config.bollingerBands.stdDev || config.bollingerBands.defaultStdDev,
    values: prices,
  });

  return { ema, rsi, macd, bb };
}

app.get("/indicators", async (req, res) => {
  try {
    const {
      symbol,
      prices,
      emaPeriod,
      rsiPeriod,
      macdFast,
      macdSlow,
      macdSignal,
      bbPeriod,
      bbStdDev,
    } = req.query;
    if (!symbol || !prices)
      return res.status(400).json({ error: "Symbol and prices are required." });

    const priceData = JSON.parse(prices); // Assuming prices are sent as JSON string

    //Override defaults if parameters are provided
    const customConfig = {
      ema: { period: parseInt(emaPeriod) || indicatorConfig.ema.default },
      rsi: { period: parseInt(rsiPeriod) || indicatorConfig.rsi.default },
      macd: {
        fastPeriod: parseInt(macdFast) || indicatorConfig.macd.defaultFast,
        slowPeriod: parseInt(macdSlow) || indicatorConfig.macd.defaultSlow,
        signalPeriod:
          parseInt(macdSignal) || indicatorConfig.macd.defaultSignal,
      },
      bollingerBands: {
        period:
          parseInt(bbPeriod) || indicatorConfig.bollingerBands.defaultPeriod,
        stdDev:
          parseFloat(bbStdDev) || indicatorConfig.bollingerBands.defaultStdDev,
      },
    };

    const indicators = await calculateIndicators(priceData, customConfig);
    res.json({ symbol, indicators });
  } catch (error) {
    console.error("Error calculating indicators:", error);
    res.status(500).json({ error: "Failed to calculate indicators." });
  }
});

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  try {
    const context = await loadContextFor(component);
    res.send(context);
  } catch (error) {
    console.error("Error loading context:", error);
    res.status(500).send("Error loading context.");
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
