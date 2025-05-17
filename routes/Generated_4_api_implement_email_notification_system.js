const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const moment = require("moment-timezone");

const app = express();
app.use(express.json());

// Rate limiting: 1 request per 4 hours
const limiter = rateLimit({
  windowMs: 4 * 60 * 60 * 1000, // 4 hours
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
});

// Email configuration (replace with your credentials)
const transporter = nodemailer.createTransport({
  service: "gmail", // Or your email provider
  auth: {
    user: "your_email@gmail.com",
    pass: "your_password",
  },
});

// Email template
function generateEmailBody(
  signalType,
  timestampAEST,
  currentPrice,
  indicatorsSummary,
) {
  return `
    <h1>Trading Signal Alert</h1>
    <p>Signal Type: ${signalType}</p>
    <p>Timestamp (AEST): ${timestampAEST}</p>
    <p>Current Price: ${currentPrice}</p>
    <p>Indicators Summary:</p>
    <ul>
      ${indicatorsSummary.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

// Validation middleware
function validateSignalData(req, res, next) {
  const { signalType, currentPrice, indicatorsSummary } = req.body;
  if (
    !signalType ||
    !currentPrice ||
    !indicatorsSummary ||
    indicatorsSummary.length === 0
  ) {
    return res.status(400).json({ error: "Missing or invalid signal data." });
  }
  if (!["Strong Buy", "Strong Sell"].includes(signalType)) {
    return res.status(400).json({ error: "Invalid signal type." });
  }
  next();
}

app.post("/api/send-signal", limiter, validateSignalData, async (req, res) => {
  try {
    const { signalType, currentPrice, indicatorsSummary } = req.body;
    const timestampAEST = moment()
      .tz("Australia/Sydney")
      .format("YYYY-MM-DD HH:mm:ss");

    const mailOptions = {
      from: "your_email@gmail.com",
      to: "kesarwanimohit@yahoo.com",
      subject: `Trading Signal Alert: ${signalType}`,
      html: generateEmailBody(
        signalType,
        timestampAEST,
        currentPrice,
        indicatorsSummary,
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    res.status(200).json({ message: "Signal notification sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send signal notification." });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
