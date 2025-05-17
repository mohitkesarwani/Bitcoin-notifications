// server.js
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const contextLoader = require("./context/contextLoader");
const githubContextLoader = require("./context/githubContextLoader");
const { loadContextFor: loadLocalContext } = require("./context/contextLoader");
const {
  loadContextFor: loadGithubContext,
} = require("./context/githubContextLoader");

const logger = require("./logger"); // Assuming you have a logger module

app.use(express.json());

//Example routes demonstrating the use of environment variables
app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  const source = process.env.CONTEXT_SOURCE || "local"; // Default to local if not specified

  try {
    let context;
    if (source === "github") {
      context = await loadGithubContext(component);
    } else {
      context = loadLocalContext(component);
    }

    res.send(context);
  } catch (error) {
    logger.error("Error fetching context:", error);
    res.status(500).send("Error fetching context");
  }
});

// CoinGecko API Key and Email Credentials Handling
app.get("/api-keys", (req, res) => {
  //In production this would never be exposed.  It's here for demonstration purposes only.  The config should be in a .env file.
  res.json({
    coinGeckoApiKey: process.env.COINGECKO_API_KEY,
    emailUsername: process.env.EMAIL_USERNAME,
    emailPassword: process.env.EMAIL_PASSWORD, //Note: NEVER expose passwords directly in production.  Use a secure secret management service.
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

// logger.js (Example logger module)
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    // Add other transports like file transport for production
  ],
});

module.exports = logger;
