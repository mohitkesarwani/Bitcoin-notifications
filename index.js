// index.js
require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const { RSI } = require('technicalindicators');
const nodemailer = require('nodemailer');

const API_ENDPOINT = process.env.API_ENDPOINT;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/5 * * * *'; // Default every 5 minutes
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const RSI_THRESHOLD_OVERBOUGHT = parseInt(process.env.RSI_THRESHOLD_OVERBOUGHT) || 70;
const RSI_THRESHOLD_OVERSOLD = parseInt(process.env.RSI_THRESHOLD_OVERSOLD) || 30;
const DATA_PERIOD = parseInt(process.env.DATA_PERIOD) || 14;
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true' || false;

async function fetchData() {
  try {
    const response = await axios.get(API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }
}

async function analyzeData(data) {
  if (!data || data.length === 0 || !data[0].close) {
    console.warn('Invalid data or empty data array. Skipping analysis.');
    return null;
  }

  const closePrices = data.map((item) => item.close);

  const rsi = new RSI({
    values: closePrices,
    period: DATA_PERIOD,
  });

  const rsiValues = rsi.result;
  const latestRsi = rsiValues[rsiValues.length - 1];

  return latestRsi;
}

async function sendEmail(subject, body) {
  if (!EMAIL_ENABLED) {
    console.log('Email sending is disabled.  Check EMAIL_ENABLED in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: EMAIL_ADDRESS,
    subject: subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
}

async function main() {
  const data = await fetchData();
  if (!data) return;

  const rsiValue = await analyzeData(data);
  if (rsiValue === null) return;

  console.log(`Current RSI: ${rsiValue}`);

  if (rsiValue > RSI_THRESHOLD_OVERBOUGHT) {
    console.log('Overbought condition detected!');
    await sendEmail(
      'Overbought Alert',
      `RSI is ${rsiValue}, exceeding the overbought threshold of ${RSI_THRESHOLD_OVERBOUGHT}.`
    );
  } else if (rsiValue < RSI_THRESHOLD_OVERSOLD) {
    console.log('Oversold condition detected!');
    await sendEmail('Oversold Alert', `RSI is ${rsiValue}, below the oversold threshold of ${RSI_THRESHOLD_OVERSOLD}.`);
  }
}

cron.schedule(CRON_SCHEDULE, main);

console.log('Node.js app initialized and running...');
