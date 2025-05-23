const { evaluateSignal } = require("../signalEvaluator");
const axios = require("axios");
const { sendEmail } = require("../notifier");
require("dotenv").config();

async function run() {
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
        console.error("[ERROR] Failed to send notification email", err.message);
      }
    }
  } catch (err) {
    console.error("[ERROR] Failed to fetch indicators or evaluate signal", err.message);
  }
}

run();
setInterval(run, 15 * 60 * 1000); // every 15 minutes
