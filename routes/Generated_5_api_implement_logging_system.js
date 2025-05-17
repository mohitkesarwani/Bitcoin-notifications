const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const path = require("path");
const contextLoader = require("./context/contextLoader");
const githubContextLoader = require("./context/githubContextLoader");
const { format } = require("date-fns");

const logFilePath = path.join(__dirname, "logs", "app.log");
fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

function logEvent(level, message, data) {
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
  console.log(logMessage, data);
  logStream.write(`${logMessage} ${JSON.stringify(data)}\n`);
}

app.use(express.json());

app.get("/context/:component", async (req, res) => {
  const component = req.params.component;
  try {
    let context;
    if (
      component === "Frontend" ||
      component === "Backend" ||
      component === "Testing"
    ) {
      context = contextLoader.loadContextFor(component);
      logEvent("info", `Local context loaded for ${component}`, { component });
    } else if (
      component === "GithubFrontend" ||
      component === "GithubBackend" ||
      component === ""
    ) {
      context = await githubContextLoader.loadContextFor(
        component === "" ? "" : component.replace("Github", ""),
      );
      logEvent("info", `GitHub context loaded for ${component}`, { component });
    } else {
      return res.status(400).json({ error: "Invalid component specified" });
    }
    res.json({ context });
  } catch (error) {
    logEvent("error", `Error loading context for ${component}`, {
      error,
      component,
    });
    res.status(500).json({ error: "Failed to load context" });
  }
});

// Example usage of logging for other events (signals, email notifications)
app.post("/generate-signal", (req, res) => {
  const signalType = req.body.type;
  const signalData = req.body.data;
  logEvent("info", `Signal generated: ${signalType}`, {
    signalType,
    signalData,
  });
  res.status(200).json({ message: "Signal generated successfully" });
});

app.post("/send-email", (req, res) => {
  const recipient = req.body.recipient;
  const subject = req.body.subject;
  const message = req.body.message;
  logEvent("info", `Email sent to ${recipient}: ${subject}`, {
    recipient,
    subject,
    message,
  });
  res.status(200).json({ message: "Email sent successfully" });
});

app.listen(port, () => {
  logEvent("info", `Server listening on port ${port}`);
  console.log(`Server listening on port ${port}`);
});
