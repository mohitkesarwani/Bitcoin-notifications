# Bitcoin Notification API

This project provides a simple Express server that fetches current Bitcoin data from the Twelve Data API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and set your `TWELVE_DATA_API_KEY`:

```bash
cp .env.example .env
# Edit .env and add your API key
```

The `.env` file also allows configuration of `CACHE_TTL_MINUTES` which
controls how long API responses are cached. Increasing this value reduces
the number of requests made to Twelve Data.

3. Start the server:

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## Testing the price and RSI endpoint

Use `curl` or any HTTP client to fetch Bitcoin data:

```bash
curl http://localhost:3000/api/btc-data
```

The response will be a JSON object:

```json
{
  "price": "12345.67",
  "rsi": "70.5"
}
```

## Fetching technical indicators

The API also exposes `/api/btc-indicators` which returns multiple Bitcoin indicators in a single request. Example usage:

```bash
curl http://localhost:3000/api/btc-indicators
```

The response contains multiple indicators along with the configured strategy thresholds:

```json
{
  "rsi": {"values": [...]},
  "macd": {"values": [...]},
  "ema20": {"values": [...]},
  "sma50": {"values": [...]},
  "bbands": {"values": [...]},
  "stochastic": {"values": [...]},
  "adx": {"values": [...]},
  "cci": {"values": [...]},
  "config": {
    "buyRules": { ... },
    "sellRules": { ... }
  }
}
```

If one or more indicators fail to load, the response will still include the available indicators and an `errors` array describing which ones failed.

## Deploying to Render

This repository includes a `render.yaml` file so the API can be easily deployed
to [Render](https://render.com). To deploy:

1. Push your fork of this repository to a GitHub account.
2. Create a new **Web Service** on Render and point it at your repository.
3. When prompted, Render will detect `render.yaml` and automatically configure
   the service. Provide your `TWELVE_DATA_API_KEY` in the service's environment
   settings.

Render will then build and start the server using the commands defined in
`render.yaml`.

## Logging

Each API request to Twelve Data is logged to the console. Successful requests
are prefixed with `[API]` and cache hits with `[CACHE]`. Errors are logged with
`[API]` followed by the error message so they can be viewed in platforms like
Railway or Render.

## Background Cron Job

If `ENABLE_CRON=true` is set in the environment, the server will run a
background task every 15 minutes. This task fetches `/api/btc-indicators`,
evaluates the trading signal and logs the result. When email credentials are
configured and `ENABLE_NOTIFICATIONS=true`, alert emails are sent on BUY or
SELL signals.
