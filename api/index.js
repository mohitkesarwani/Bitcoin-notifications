import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { run as cronRun } from './cron/evaluateAndLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'config.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    const cfg = {
      alertEmail: process.env.ALERT_EMAIL || 'you@example.com',
      rsiBuyThreshold: Number(process.env.RSI_BUY_THRESHOLD || 30),
      rsiSellThreshold: Number(process.env.RSI_SELL_THRESHOLD || 70),
      macdSignal: Number(process.env.MACD_SIGNAL || 0),
      adxMinStrength: Number(process.env.ADX_MIN_STRENGTH || 20),
      cciBuyThreshold: Number(process.env.CCI_BUY_THRESHOLD || 100),
      cciSellThreshold: Number(process.env.CCI_SELL_THRESHOLD || -100),
      stochBuyThreshold: Number(process.env.STOCH_BUY_THRESHOLD || 20),
      stochSellThreshold: Number(process.env.STOCH_SELL_THRESHOLD || 80),
      enabledCoins: (process.env.ENABLED_COINS || 'BTC,ETH,SOL,XRP,ADA').split(','),
      useRsi: process.env.USE_RSI !== 'false',
      useMacd: process.env.USE_MACD !== 'false',
      useAdx: process.env.USE_ADX !== 'false',
      useCci: process.env.USE_CCI !== 'false',
      useStoch: process.env.USE_STOCH !== 'false'
    };
    await saveConfig(cfg);
    return cfg;
  }
}

async function saveConfig(cfg) {
  await fs.writeFile(configPath, JSON.stringify(cfg, null, 2));
}

let currentConfig = await loadConfig();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/config', (req, res) => {
  res.json(currentConfig);
});

app.post('/config', async (req, res) => {
  currentConfig = { ...currentConfig, ...req.body };
  await saveConfig(currentConfig);
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});

cron.schedule('0 */12 * * *', async () => {
  try {
    currentConfig = await loadConfig();
    await cronRun(currentConfig);
  } catch (err) {
    console.error('[CRON ERROR]', err);
  }
});
