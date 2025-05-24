import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSignal } from '../signalEvaluator.js';

test('evaluateSignal returns BUY with multiple bullish indicators', () => {
  const data = {
    rsi: 25,
    macd: 2,
    macdSignal: 1,
    adx: 25,
    cci: -120,
    stochasticK: 10,
    stochasticD: 10,
    price: 100,
    previousMacd: 0,
    previousSignal: 1
  };

  const result = evaluateSignal(data);
  assert.equal(result.signal, 'BUY');
  assert.ok(result.reason.includes('RSI below 30'));
});
