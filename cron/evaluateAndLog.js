import axios from 'axios';
import { evaluateSignal } from '../signalEvaluator.js';
import { sendEmail } from '../notifier.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    console.log(`[CRON] Running at ${new Date().toISOString()}`);
    const res = await axios.get(`${process.env.API_BASE_URL}/api/btc-indicators`);
    const result = evaluateSignal(res.data);
    console.log(`[SIGNAL] ${result.signal} - ${result.reason.join(', ')}`);
    if (['BUY', 'SELL'].includes(result.signal)) {
      await sendEmail(`${result.signal} Signal`, result.reason.join('\n'));
      console.log(`[EMAIL] Sent ${result.signal} notification`);
    }
  } catch (error) {
    console.error(`[CRON ERROR] ${error.message}`);
  }
}

export { run };
