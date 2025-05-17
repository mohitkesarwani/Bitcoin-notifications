const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const moment = require("moment-timezone");

const app = express();
app.use(express.json());

// Configuration
const emailConfig = {
  host: "smtp.gmail.com", // Or your SMTP provider
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
};

const rateLimiter = rateLimit({
  windowMs: 4 * 60 * 60 * 1000, // 4 hours
  max: 1, // Limit each IP to 1 request per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Email Sender
const transporter = nodemailer.createTransport(emailConfig);

async function sendEmail(signalType, price, indicators) {
  const aestTimestamp = moment()
    .tz("Australia/Sydney")
    .format("YYYY-MM-DD HH:mm:ss");
  const mailOptions = {
    from: emailConfig.auth.user,
    to: "kesarwanimohit@yahoo.com",
    subject: `Trading Signal: ${signalType}`,
    text: `Signal: ${signalType}\nTimestamp (AEST): ${aestTimestamp}\nPrice: ${price}\nIndicators: ${indicators}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// API Route
app.post("/signal", rateLimiter, async (req, res) => {
  const { signalType, price, indicators } = req.body;

  // Input Validation
  if (!signalType || !price || !indicators) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["Strong Buy", "Strong Sell"].includes(signalType)) {
    return res.status(400).json({ error: "Invalid signal type" });
  }

  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ error: "Invalid price" });
  }

  try {
    if (signalType === "Strong Buy" || signalType === "Strong Sell") {
      await sendEmail(signalType, price, indicators);
    }

    res.status(200).json({ message: "Signal received" });
  } catch (error) {
    console.error("Error processing signal:", error);
    res.status(500).json({ error: "Failed to process signal" });
  }
});

//Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
