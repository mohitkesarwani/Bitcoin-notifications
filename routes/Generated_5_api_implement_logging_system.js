const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'combined.log' })],
});

// Sample price data (replace with your actual data source)
let priceData = [];

// Sample signal generation logic (replace with your actual logic)
function generateSignal(price) {
  // Simulate signal generation, replace with your actual logic.
  const random = Math.random();
  const signal = random > 0.5 ? 'strong buy' : random > 0.2 ? 'buy' : random > 0.1 ? 'weak buy' : 'neutral';
  return signal;
}

// Simulate sending email (replace with your actual email sending logic)
function sendEmailNotification(signal, price) {
  logger.info(`Sent email notification: Signal - ${signal}, Price - ${price}`);
  //Replace with your actual email sending logic.  For example using nodemailer.
}

app.use(express.json());

app.post('/prices', (req, res) => {
  try {
    const newPriceData = req.body;
    // Input validation.  Add more robust validation as needed.
    if (!newPriceData || !newPriceData.price || typeof newPriceData.price !== 'number') {
      return res.status(400).json({ error: 'Invalid price data' });
    }

    priceData.push({ timestamp: new Date(), price: newPriceData.price });
    logger.info(`Recorded price data: ${JSON.stringify(newPriceData)}`);
    const signal = generateSignal(newPriceData.price);
    logger.info(`Generated signal: ${signal}, Price: ${newPriceData.price}`);

    // Only send email for strong signals (adjust as needed)
    if (signal.includes('strong')) {
      sendEmailNotification(signal, newPriceData.price);
    }

    res.status(201).json({ message: 'Price data recorded' });
  } catch (error) {
    logger.error(`Error recording price data: ${error.message}`);
    res.status(500).json({ error: 'Failed to record price data' });
  }
});

app.get('/logs', (req, res) => {
  try {
    const logContent = fs.readFileSync(path.join(__dirname, 'combined.log'), 'utf8');
    res.send(logContent);
  } catch (error) {
    logger.error(`Error reading logs: ${error.message}`);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
