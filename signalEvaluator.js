function evaluateSignal(data) {
  const result = { signal: 'HOLD', reason: [] };
  if (!data || !data.config) {
    return result;
  }

  const buyRules = data.config.buyRules || {};
  const sellRules = data.config.sellRules || {};

  const latest = (path) => {
    const parts = path.split('.');
    let value = data;
    for (const p of parts) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return NaN;
      }
    }
    return parseFloat(value);
  };

  const rsi = latest('rsi.values.0.rsi');
  const macd = latest('macd.values.0.macd');
  const macdSignal = latest('macd.values.0.macd_signal');
  const price = latest('bbands.values.0.real');
  const lowerBand = latest('bbands.values.0.lower_band');
  const upperBand = latest('bbands.values.0.upper_band');
  const cci = latest('cci.values.0.cci');
  const adx = latest('adx.values.0.adx');
  const stoch = latest('stochastic.values.0.slow_k');

  const buyReasons = [];
  const sellReasons = [];

  if (buyRules.useRsi && !Number.isNaN(rsi) && buyRules.rsiOversold != null && rsi < buyRules.rsiOversold) {
    buyReasons.push('RSI below threshold');
  }
  if (sellRules.useRsi && !Number.isNaN(rsi) && sellRules.rsiOverbought != null && rsi > sellRules.rsiOverbought) {
    sellReasons.push('RSI above threshold');
  }

  if (buyRules.useMacd && !Number.isNaN(macd) && !Number.isNaN(macdSignal) && macd > macdSignal) {
    buyReasons.push('MACD bullish crossover');
  }
  if (sellRules.useMacd && !Number.isNaN(macd) && !Number.isNaN(macdSignal) && macd < macdSignal) {
    sellReasons.push('MACD bearish crossover');
  }

  if (buyRules.useBbands && !Number.isNaN(price) && !Number.isNaN(lowerBand) && price < lowerBand) {
    buyReasons.push('Price below Bollinger lower band');
  }
  if (sellRules.useBbands && !Number.isNaN(price) && !Number.isNaN(upperBand) && price > upperBand) {
    sellReasons.push('Price above Bollinger upper band');
  }

  if (buyRules.useCci && !Number.isNaN(cci) && buyRules.cciThreshold != null && cci < buyRules.cciThreshold) {
    buyReasons.push('CCI below threshold');
  }
  if (sellRules.useCci && !Number.isNaN(cci) && sellRules.cciThreshold != null && cci > sellRules.cciThreshold) {
    sellReasons.push('CCI above threshold');
  }

  if (buyRules.useAdx && !Number.isNaN(adx) && buyRules.adxThreshold != null && adx > buyRules.adxThreshold) {
    buyReasons.push('ADX above threshold');
  }
  if (sellRules.useAdx && !Number.isNaN(adx) && sellRules.adxThreshold != null && adx > sellRules.adxThreshold) {
    sellReasons.push('ADX above threshold');
  }

  if (buyRules.useStoch && !Number.isNaN(stoch) && buyRules.stochOversold != null && stoch < buyRules.stochOversold) {
    buyReasons.push('Stochastic below threshold');
  }
  if (sellRules.useStoch && !Number.isNaN(stoch) && sellRules.stochOverbought != null && stoch > sellRules.stochOverbought) {
    sellReasons.push('Stochastic above threshold');
  }

  const buy = buyReasons.length > 0;
  const sell = sellReasons.length > 0;

  if (buy && !sell) {
    result.signal = 'BUY';
    result.reason = buyReasons;
  } else if (sell && !buy) {
    result.signal = 'SELL';
    result.reason = sellReasons;
  } else if (buy && sell) {
    result.signal = 'HOLD';
    result.reason = [...buyReasons, ...sellReasons];
  }

  return result;
}

module.exports = { evaluateSignal };
