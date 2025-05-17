const express = require("express");
const app = express();
const port = 3000;
const fs = require("node:fs/promises");
const path = require("path");
const axios = require("axios");
const { loadContextFor: loadLocalContext } = require("./context/contextLoader");
const {
  loadContextFor: loadGitHubContext,
} = require("./context/githubContextLoader");
require("dotenv").config();

app.use(express.json());

// Retry mechanism for Axios requests
const axiosRetry = require("axios-retry");
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Helper function to handle errors consistently
function handleError(res, error, message) {
  console.error(message, error);
  res.status(500).json({ error: message, details: error.message });
}

app.get("/api/context/:component", async (req, res) => {
  const component = req.params.component;
  const source = process.env.CONTEXT_SOURCE || "local"; //default to local if not specified

  try {
    let context;
    if (source === "github") {
      context = await loadGitHubContext(component);
    } else {
      context = loadLocalContext(component);
    }
    res.json({ context });
  } catch (error) {
    handleError(res, error, `Failed to load context for ${component}`);
  }
});

//Robust file reading with error handling and optional retry
async function readFileRobustly(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`File not found: ${filePath}`);
      return null; // Or throw, depending on your desired behaviour
    }
    console.error(`Error reading file ${filePath}:`, error);
    //Optionally retry here based on error type or other criteria.
    throw error; // Re-throw for higher-level handling if needed.
  }
}

// Example of using the robust file reading function (can be integrated elsewhere)
async function testRobustRead() {
  const filePath = path.join(__dirname, "./testfile.txt");
  const data = await readFileRobustly(filePath);
  console.log("File content:", data);
}

app.listen(port, () => {
  console.log(`Context API listening on port ${port}`);
});
