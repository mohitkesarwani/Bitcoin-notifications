# Bitcoin Notifications API

This project provides a simple Express API that aggregates multiple Bitcoin technical indicators from the [Twelve Data API](https://twelvedata.com/).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add your Twelve Data API key.

```bash
cp .env.example .env
```

3. Start the server:

```bash
npm start
```

4. Run tests:

```bash
npm test
```

The server runs on `PORT` specified in `.env` (defaults to `3000`).

## Endpoint

### `GET /api/btc-indicators`

Fetches key BTC/USD indicators in parallel and returns a JSON object with the following structure:

```json
{
  "rsi": { "..." },
  "macd": { "..." },
  "ema20": { "..." },
  "sma50": { "..." },
  "bbands": { "..." },
  "errors": [
    { "indicator": "ema20", "message": "Request failed" }
  ]
}
```

If any indicator fails to load, the endpoint still returns the successful results and includes an `errors` array describing which indicators failed.

This endpoint is intended for use with scheduled jobs that evaluate market conditions and trigger trade alerts.

