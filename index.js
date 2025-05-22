require('dotenv').config();
const express = require('express');
const indicatorRoutes = require('./routes/indicators');
const startIndicatorCron = require('./cron/indicatorCheck');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/btc-indicators', indicatorRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startIndicatorCron();
});
