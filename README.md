# Bitcoin Notifications

Simple Node.js backend that exposes technical indicators for BTC/USD and runs a scheduled job to evaluate buy/sell signals.

## Setup

1. Install dependencies (requires Node.js):

```bash
npm install
```

2. Copy `.env.example` to `.env` and adjust values if necessary.

```bash
cp .env.example .env
```

- `RSI_BUY_THRESHOLD` and `RSI_SELL_THRESHOLD` define RSI levels for buy/sell.
- `ENABLE_MACD` and `ENABLE_BBANDS` enable their respective checks.
- `CRON_SCHEDULE` controls how often the job runs (cron syntax).

3. Start the server:

```bash
npm start
```

The server exposes `GET /api/btc-indicators` and runs a cron task that logs the current trading signal.
