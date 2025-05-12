// src/btcPriceFetcher.js
const axios = require('axios');

const COIN_GECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart';

class BTCPriceFetcher {
  constructor(interval = 15 * 60 * 1000) {
    this.interval = interval;
    this.btcData = null;
    this.fetchData = this.fetchData.bind(this);
  }

  async fetchData() {
    try {
      const response = await axios.get(COIN_GECKO_API_URL, {
        params: {
          vs_currency: 'usd',
          days: '1',
        },
      });

      if (response.status === 200) {
        const { prices, market_caps, total_volumes } = response.data;

        if (prices && market_caps && total_volumes) {
          const lastPrice = prices[prices.length - 1];
          const lastMarketCap = market_caps[market_caps.length - 1];
          const lastVolume = total_volumes[total_volumes.length - 1];

          this.btcData = {
            timestamp: lastPrice[0],
            price: lastPrice[1],
            market_cap: lastMarketCap[1],
            volume: lastVolume[1],
          };

          console.log('BTC Price Data Updated:', this.btcData);
        } else {
          console.warn('⚠️  Invalid data structure from CoinGecko API');
        }
      } else {
        console.error('⚠️  CoinGecko API Error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('⚠️  Failed to fetch BTC price:', error.message);
    }
  }

  startFetching() {
    this.fetchData();
    this.intervalId = setInterval(this.fetchData, this.interval);
  }

  stopFetching() {
    clearInterval(this.intervalId);
  }

  getLatestData() {
    return this.btcData;
  }
}

module.exports = BTCPriceFetcher;
