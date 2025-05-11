```javascript
const express = require('express');
const router = express.Router();
const { checkSignal } = require('../services/signalService'); // Assuming signalService.js exists and exports checkSignal
const { getSignalState } = require('../models/signalModel'); // Assuming signalModel.js exists and exports getSignalState

// Existing health check route (if it exists) - modify as needed
router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// NEW: Endpoint to manually trigger signal check and return current signal state
router.get('/btc-signal', async (req, res) => {
  try {
    // Trigger signal check
    await checkSignal();

    // Get the current signal state
    const signalState = await getSignalState(); // Adjust this based on your actual model

    // Respond with the signal state
    res.status(200).json({
      message: 'Signal check triggered successfully.',
      signal: signalState,
    });
  } catch (error) {
    console.error('Error triggering/retrieving signal:', error);
    res.status(500).json({ error: 'Failed to trigger/retrieve signal.' });
  }
});

module.exports = router;
```