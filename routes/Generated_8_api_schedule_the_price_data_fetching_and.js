// backend/scheduler.js
const cron = require('node-cron');
const { fetchPriceData } = require('./services/priceFetcher');
const { executeRules } = require('./services/ruleEngine');
const { getConfig } = require('./config');

let scheduledTask;

async function startScheduler() {
  const config = getConfig();
  const cronSchedule = config.cronSchedule || '*/5 * * * *'; // Default to every 5 minutes

  if (scheduledTask) {
    scheduledTask.destroy(); // Stop any existing task
  }

  scheduledTask = cron.schedule(cronSchedule, async () => {
    console.log('Scheduler: Running price data fetch and rule engine...');
    try {
      await fetchPriceData();
      await executeRules();
      console.log('Scheduler: Completed price data fetch and rule engine.');
    } catch (error) {
      console.error('Scheduler: Error during scheduled task:', error);
    }
  });

  console.log(`Scheduler: Started with schedule ${cronSchedule}`);
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.destroy();
    console.log('Scheduler: Stopped');
  } else {
    console.log('Scheduler: Not running');
  }
}

module.exports = { startScheduler, stopScheduler };
