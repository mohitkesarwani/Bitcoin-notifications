const express = require("express");
const app = express();
const port = 3000;
const fs = require("node:fs");
const path = require("node:path");
const contextLoader = require("./context/contextLoader");
const githubContextLoader = require("./context/githubContextLoader");

// Configure environment variables (replace with your actual methods)
require("dotenv").config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!GITHUB_TOKEN || !EMAIL_USER || !EMAIL_PASS) {
  console.error(
    " Error: Missing environment variables. Please set GITHUB_TOKEN, EMAIL_USER, and EMAIL_PASS.",
  );
  process.exit(1);
}

app.use(express.json());

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  try {
    let context;
    if (process.env.USE_GITHUB === "true") {
      context = await githubContextLoader.loadContextFor(component);
    } else {
      context = contextLoader.loadContextFor(component);
    }
    res.send(context);
  } catch (error) {
    console.error("Error fetching context:", error);
    res.status(500).send("Error fetching context");
  }
});

// Example route demonstrating email functionality (replace with your actual email sending logic)
app.post("/send-email", (req, res) => {
  // Validate request body (add your validation logic here)
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Replace with your actual email sending implementation using nodemailer or similar
  console.log(`Sending email to ${to}: Subject: ${subject}, Body: ${body}`);
  res.json({ message: "Email sent successfully (simulated)" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
