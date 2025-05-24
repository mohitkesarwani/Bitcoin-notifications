import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSignal } from '../signalEvaluator.js';

const defaultConfig = {
  rsiBuyThreshold: 30,
  rsiSellThreshold: 70,
  adxMinStrength: 20,
  cciBuyThreshold: 100,
  cciSellThreshold: -100,
  stochBuyThreshold: 20,
  stochSellThreshold: 80,
  useRsi: true,
  useMacd: true,
  useAdx: true,
  useCci: true,
  useStoch: true
};

test('evaluateSignal returns BUY with multiple bullish indicators', () => {
  const data = {
    rsi: 25,
    macd: 2,
    macdSignal: 1,
    adx: 25,
    cci: 120,
    stochasticK: 85,
    stochasticD: 80,
    price: 100,
    previousMacd: 0,
    previousSignal: 1
  };

  const result = evaluateSignal(data, defaultConfig);
  assert.equal(result.signal, 'BUY');
  assert.ok(result.reason.includes('RSI oversold'));
  assert.ok(result.reason.includes('MACD bullish crossover'));
  assert.ok(result.reason.includes('ADX above 20'));
  assert.ok(result.reason.includes('CCI bullish'));
  assert.ok(result.reason.includes('Stochastic overbought (bullish continuation)'));
});

test('evaluateSignal returns SELL with multiple bearish indicators', () => {
  const data = {
    rsi: 75,
    macd: -1,
    macdSignal: 0,
    adx: 15,
    cci: -150,
    stochasticK: 10,
    stochasticD: 15,
    price: 100,
    previousMacd: 0,
    previousSignal: -0.5
  };

  const result = evaluateSignal(data, defaultConfig);
  assert.equal(result.signal, 'SELL');
  assert.ok(result.reason.includes('RSI overbought'));
  assert.ok(result.reason.includes('MACD bearish crossover'));
  assert.ok(result.reason.includes('CCI bearish'));
  assert.ok(result.reason.includes('Stochastic oversold (bearish continuation)'));
});
