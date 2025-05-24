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
}, config = {}) {
  const {
    rsiBuyThreshold = 30,
    rsiSellThreshold = 70,
    adxMinStrength = 20,
    cciBuyThreshold = 100,
    cciSellThreshold = -100,
    stochBuyThreshold = 20,
    stochSellThreshold = 80,
    useRsi = true,
    useMacd = true,
    useAdx = true,
    useCci = true,
    useStoch = true
  } = config;
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

  if (useRsi && !Number.isNaN(rsi)) {
    if (rsiBuyThreshold !== null && rsi < rsiBuyThreshold) {
      addReason('RSI oversold', 'bullish');
    } else if (rsiSellThreshold !== null && rsi > rsiSellThreshold) {
      addReason('RSI overbought', 'bearish');
    }
  }

  if (useMacd && !Number.isNaN(macd) && !Number.isNaN(macdSignal)) {
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

  if (useAdx && !Number.isNaN(adx)) {
    if (adxMinStrength !== null && adx > adxMinStrength) {
      addReason(`ADX above ${adxMinStrength}`, 'bullish');
    }
  }

  if (useCci && !Number.isNaN(cci)) {
    if (cciBuyThreshold !== null && cci > cciBuyThreshold) {
      addReason('CCI bullish', 'bullish');
    } else if (cciSellThreshold !== null && cci < cciSellThreshold) {
      addReason('CCI bearish', 'bearish');
    }
  }

  if (useStoch && !Number.isNaN(stochasticK)) {
    if (stochSellThreshold !== null && stochasticK > stochSellThreshold) {
      addReason('Stochastic overbought (bullish continuation)', 'bullish');
    } else if (stochBuyThreshold !== null && stochasticK < stochBuyThreshold) {
      addReason('Stochastic oversold (bearish continuation)', 'bearish');
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

  reasons.sort();

  return {
    signal,
    reason: reasons
  };
}

export { evaluateSignal };
