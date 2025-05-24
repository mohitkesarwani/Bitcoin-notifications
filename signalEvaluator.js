function evaluateSignal({
  rsi,
  macd,
  macdSignal,
  adx,
  cci,
  stochasticK,
  stochasticD,
  price,
  previousMacd,
  previousSignal
}) {
  const reasons = [];
  const seen = new Set();
  let bullish = 0;
  let bearish = 0;

  const addReason = (reason, type) => {
    if (!seen.has(reason)) {
      seen.add(reason);
      reasons.push(reason);
    }
    if (type === 'bullish') bullish += 1;
    if (type === 'bearish') bearish += 1;
  };

  if (!Number.isNaN(rsi)) {
    if (rsi < 30) {
      addReason('RSI below 30', 'bullish');
    } else if (rsi > 70) {
      addReason('RSI above 70', 'bearish');
    }
  }

  if (!Number.isNaN(macd) && !Number.isNaN(macdSignal)) {
    if (
      macd > macdSignal &&
      (Number.isNaN(previousMacd) || Number.isNaN(previousSignal) || previousMacd <= previousSignal)
    ) {
      addReason('MACD bullish crossover', 'bullish');
    } else if (
      macd < macdSignal &&
      (Number.isNaN(previousMacd) || Number.isNaN(previousSignal) || previousMacd >= previousSignal)
    ) {
      addReason('MACD bearish crossover', 'bearish');
    }
  }

  if (!Number.isNaN(adx)) {
    if (adx > 20) {
      addReason('ADX above 20', 'bullish');
    } else if (adx < 20) {
      addReason('ADX below 20', 'bearish');
    }
  }

  if (!Number.isNaN(cci)) {
    if (cci < -100) {
      addReason('CCI below -100', 'bullish');
    } else if (cci > 100) {
      addReason('CCI above 100', 'bearish');
    }
  }

  if (!Number.isNaN(stochasticK)) {
    if (stochasticK > 80) {
      addReason('Stochastic above 80', 'bearish');
    } else if (stochasticK < 20) {
      addReason('Stochastic below 20', 'bullish');
    }
  }

  let signal = 'HOLD';

  if (bullish >= 3 && bearish <= 1) {
    signal = 'BUY';
  } else if (bearish >= 3 && bullish <= 1) {
    signal = 'SELL';
  } else if (bullish > 0 && bearish > 0) {
    addReason('Conflicting signals');
  }

  if (reasons.length === 0) {
    reasons.push('No trigger conditions met');
  }

  return {
    signal,
    reason: reasons
  };
}

export { evaluateSignal };
