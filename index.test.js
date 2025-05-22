import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './index.js';

const sampleData = { data: { value: 1 } };
const fakeAxios = { get: async () => sampleData };

const app = createApp(fakeAxios);
const server = app.listen(0);
const baseUrl = `http://localhost:${server.address().port}`;

after(() => {
  server.close();
});

test('GET /api/btc-indicators returns all indicators', async () => {
  const res = await fetch(`${baseUrl}/api/btc-indicators`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.rsi);
  assert.ok(body.macd);
  assert.ok(body.ema20);
  assert.ok(body.sma50);
  assert.ok(body.bbands);
});
