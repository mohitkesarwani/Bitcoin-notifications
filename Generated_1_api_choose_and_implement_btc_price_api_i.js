```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration
const COIN_ID = 'bitcoin'; // You can change this to fetch data for other cryptocurrencies
const DEFAULT_INTERVAL = '15'; // Minutes

// ----------------------------------------------------------------------------------
// Option 1: CoinGecko API
// Documentation: https://www.coingecko.com/en/api/documentation
// Rate limits: 50 calls/minute
// ----------------------------------------------------------------------------------

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

async function fetchBitcoinDataFromCoinGecko(interval) {
    try {
        const days = interval <= 60 ? '1' : interval <= (60 * 24) ? '7' : '30'; // Adjust days based on interval to avoid large data sets
        const url = `${COINGECKO_API_BASE}/coins/${COIN_ID}/ohlc?vs_currency=usd&days=${days}`;
        const response = await axios.get(url);

        // Transform the CoinGecko OHLC data to include volume (which isn't directly provided in OHLC)
        // We'll need to fetch market chart data to get volume
        const marketChartURL = `${COINGECKO_API_BASE}/coins/${COIN_ID}/market_chart?vs_currency=usd&days=${days}&interval=hourly`; // Use hourly to avoid rate limits
        const marketChartResponse = await axios.get(marketChartURL);
        const volumes = marketChartResponse.data.total_volumes;

        const ohlcData = response.data;
        const intervalNumber = parseInt(interval); // Parse the interval as an integer
        const intervalInMilliseconds = intervalNumber * 60 * 1000;

        const formattedData = ohlcData.map(([timestamp, open, high, low, close], index) => {
            // Find corresponding volume within the timestamp range
            const volumeEntry = volumes.find(([volumeTimestamp]) => {
                return timestamp <= volumeTimestamp && volumeTimestamp <= (timestamp + intervalInMilliseconds);
            });
            const volume = volumeEntry ? volumeEntry[1] : 0;

            return {
                timestamp,
                open,
                high,
                low,
                close,
                volume
            };
        });

        return formattedData;
    } catch (error) {
        console.error('Error fetching data from CoinGecko:', error.message);
        throw error;
    }
}

// ----------------------------------------------------------------------------------
// Option 2: CoinCap API (Requires websocket for real-time OHLCV)
// This is an alternative, but requires more setup (websockets).
// Not implementing CoinCap due to websocket requirement for OHLCV data.
// ----------------------------------------------------------------------------------


// Route to fetch Bitcoin OHLCV data
router.get('/bitcoin/ohlcv', async (req, res) => {
    const interval = req.query.interval || DEFAULT_INTERVAL;
    try {
        const data = await fetchBitcoinDataFromCoinGecko(interval);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Bitcoin OHLCV data' });
    }
});

module.exports = router;
```