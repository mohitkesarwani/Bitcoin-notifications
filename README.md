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

3. Start the server:

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## Testing the endpoint

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
