import { evaluateSignal } from "../signalEvaluator.js";
import axios from "axios";
import { sendEmail } from "../notifier.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const start = new Date().toISOString();
  console.log(`[CRON] Running evaluateAndLog at ${start}`);

  try {
    const res = await axios.get(`${process.env.API_BASE_URL}/api/btc-indicators`);
    const result = evaluateSignal(res.data);
    console.log(`[SIGNAL] ${result.signal} - ${result.reason.join(", ")}`);
    if (result.signal === "BUY" || result.signal === "SELL") {
      try {
        await sendEmail(
          `${result.signal} Signal Triggered`,
          result.reason.join("\n")
        );
      } catch (err) {
        console.error(`[ERROR] Failed to send notification email`, err.message);
      }
    }
  } catch (err) {
    console.error(`[ERROR] Failed to fetch indicators or evaluate signal`, err.message);
  }
}

export { run };
