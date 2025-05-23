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
  console.log(`[CRON START] Evaluating ${trackedAssets.length} assets`);
  let buy = 0;
  let sell = 0;
  let hold = 0;

  for (const asset of trackedAssets) {
    console.log(`[CRON] Checking ${asset.name} at ${new Date().toISOString()}`);
    try {
      const url = `${process.env.API_BASE_URL}/api/btc-indicators?symbol=${encodeURIComponent(asset.symbol)}`;
      const res = await axios.get(url);
      const result = evaluateSignal(res.data);
      console.log(`[SIGNAL][${asset.name}] ${result.signal} - ${result.reason.join(', ')}`);
      if (result.signal === 'BUY') buy++;
      else if (result.signal === 'SELL') sell++;
      else hold++;

      if (['BUY', 'SELL'].includes(result.signal)) {
        await sendEmail(`[${asset.name}] ${result.signal}`, result.reason.join('\n'));
        console.log(`[EMAIL][${asset.name}] Sent ${result.signal} notification`);
      }
    } catch (error) {
      console.error(`[CRON ERROR][${asset.name}] ${error.message}`);
      hold++;
    }
  }

  console.log(`[CRON COMPLETE] ${trackedAssets.length} assets checked, ${buy} BUY, ${sell} SELL, ${hold} HOLD`);
}

export { run };
