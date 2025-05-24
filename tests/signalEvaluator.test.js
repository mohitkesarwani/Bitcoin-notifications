import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSignal } from '../signalEvaluator.js';

// Basic sanity check for BUY signal when RSI below threshold

test('evaluateSignal returns BUY when RSI below oversold threshold', () => {
  const data = {
    rsi: { values: [{ rsi: 25 }] },
    macd: { values: [{ macd: 0, macd_signal: 0 }] },
    bbands: { values: [{ real: 100, lower_band: 50, upper_band: 150 }] },
    cci: { values: [{ cci: -100 }] },
    adx: { values: [{ adx: 50 }] },
    stochastic: { values: [{ slow_k: 10, slow_d: 10 }] },
    config: {
      buyRules: {
        useRsi: true,
        rsiOversold: 30,
        useMacd: false,
        useBbands: false,
        useCci: false,
        useAdx: false,
        useStoch: false
      },
      sellRules: {}
    }
  };

  const result = evaluateSignal(data);
  assert.equal(result.signal, 'BUY');
});
