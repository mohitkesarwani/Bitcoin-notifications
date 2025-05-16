const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('node:fs');
const path = require('node:path');
const contextLoader = require('./context/contextLoader');
const githubContextLoader = require('./context/githubContextLoader');

// Configuration loading - prioritized order: environment variables, then config file
const config = {
  apiFetchInterval: process.env.API_FETCH_INTERVAL || 60000, // Default to 60 seconds
  emailNotificationFrequency: process.env.EMAIL_NOTIFICATION_FREQUENCY || 'daily', // Default to 'daily'
  technicalIndicatorParams: JSON.parse(process.env.TECHNICAL_INDICATOR_PARAMS || '{}'), // Default to empty object
};

try {
  const configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  const fileConfig = JSON.parse(configFile);
  Object.assign(config, fileConfig); // Override with config file values
} catch (err) {
  console.warn(' Configuration file not found or invalid. Using defaults or environment variables.');
}


app.use(express.json());

//Example endpoint to demonstrate configuration access
app.get('/config', (req, res) => {
    res.json(config);
});

app.get('/context/:component', async (req, res) => {
  const component = req.params.component;
  try {
    const localContext = contextLoader.loadContextFor(component);
    if(localContext){
        res.send(localContext);
        return;
    }
    const githubContext = await githubContextLoader.loadContextFor(component);
    res.send(githubContext);

  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).send('Error fetching context');
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

//Example config.json file
// {
//   "apiFetchInterval": 120000,
//   "emailNotificationFrequency": "hourly",
//   "technicalIndicatorParams": {
//     "rsiPeriod": 14,
//     "maPeriod": 20
//   }
// }