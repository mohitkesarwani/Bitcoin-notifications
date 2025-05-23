import axios from 'axios';
import { evaluateSignal } from '../signalEvaluator.js';
import { sendEmail } from '../notifier.js';
import dotenv from 'dotenv';

dotenv.config();

const trackedAssets = [
  { symbol: 'BTC/USD', name: 'Bitcoin' },
  { symbol: 'SOL/USD', name: 'Solana' },
  { symbol: 'XRP/USD', name: 'XRP' },
  { symbol: 'ADA/USD', name: 'Cardano' }
];

async function run() {
  for (const asset of trackedAssets) {
    try {
      console.log(`[CRON] Checking ${asset.name} at ${new Date().toISOString()}`);
      const url = `${process.env.API_BASE_URL}/api/btc-indicators?symbol=${encodeURIComponent(asset.symbol)}`;
      const res = await axios.get(url);
      const result = evaluateSignal(res.data);
      console.log(`[SIGNAL][${asset.name}] ${result.signal} - ${result.reason.join(', ')}`);
      if (['BUY', 'SELL'].includes(result.signal)) {
        await sendEmail(`[${asset.name}] ${result.signal}`, result.reason.join('\n'));
        console.log(`[EMAIL][${asset.name}] Sent ${result.signal} notification`);
      }
    } catch (error) {
      console.error(`[CRON ERROR][${asset.name}] ${error.message}`);
    }
  }
}

export { run };
