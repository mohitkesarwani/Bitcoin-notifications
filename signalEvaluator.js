function evaluateSignal(data) {
  const result = { signal: 'HOLD', reason: [] };
  if (!data || !data.config) {
    return result;
  }

  const buyRules = data.config.buyRules || {};
  const sellRules = data.config.sellRules || {};

  const rsi = parseFloat(data?.rsi?.values?.[0]?.rsi);
  const macd = parseFloat(data?.macd?.values?.[0]?.macd);
  const macdSignal = parseFloat(data?.macd?.values?.[0]?.macd_signal);
  const price = parseFloat(data?.bbands?.values?.[0]?.real);
  const lowerBand = parseFloat(data?.bbands?.values?.[0]?.lower_band);
  const upperBand = parseFloat(data?.bbands?.values?.[0]?.upper_band);
  const cci = parseFloat(data?.cci?.values?.[0]?.cci);
  const adx = parseFloat(data?.adx?.values?.[0]?.adx);
  const stoch = parseFloat(data?.stochastic?.values?.[0]?.slow_k);

  const buyReasons = [];
  const sellReasons = [];

  if (
    buyRules.useRsi &&
    !Number.isNaN(rsi) &&
    buyRules.rsiOversold != null &&
    rsi < buyRules.rsiOversold
  ) {
    buyReasons.push(`RSI below ${buyRules.rsiOversold}`);
  }
  if (
    sellRules.useRsi &&
    !Number.isNaN(rsi) &&
    sellRules.rsiOverbought != null &&
    rsi > sellRules.rsiOverbought
  ) {
    sellReasons.push(`RSI above ${sellRules.rsiOverbought}`);
  }

  if (
    buyRules.useMacd &&
    !Number.isNaN(macd) &&
    !Number.isNaN(macdSignal) &&
    macd > macdSignal
  ) {
    buyReasons.push('MACD bullish crossover');
  }
  if (
    sellRules.useMacd &&
    !Number.isNaN(macd) &&
    !Number.isNaN(macdSignal) &&
    macd < macdSignal
  ) {
    sellReasons.push('MACD bearish crossover');
  }

  if (
    buyRules.useBbands &&
    !Number.isNaN(price) &&
    !Number.isNaN(lowerBand) &&
    price < lowerBand
  ) {
    buyReasons.push('Price below Bollinger lower band');
  }
  if (
    sellRules.useBbands &&
    !Number.isNaN(price) &&
    !Number.isNaN(upperBand) &&
    price > upperBand
  ) {
    sellReasons.push('Price above Bollinger upper band');
  }

  if (
    buyRules.useCci &&
    !Number.isNaN(cci) &&
    buyRules.cciThreshold != null &&
    cci < buyRules.cciThreshold
  ) {
    buyReasons.push(`CCI below ${buyRules.cciThreshold}`);
  }
  if (
    sellRules.useCci &&
    !Number.isNaN(cci) &&
    sellRules.cciThreshold != null &&
    cci > sellRules.cciThreshold
  ) {
    sellReasons.push(`CCI above ${sellRules.cciThreshold}`);
  }

  if (
    buyRules.useAdx &&
    !Number.isNaN(adx) &&
    buyRules.adxThreshold != null &&
    adx > buyRules.adxThreshold
  ) {
    buyReasons.push(`ADX above ${buyRules.adxThreshold}`);
  }
  if (
    sellRules.useAdx &&
    !Number.isNaN(adx) &&
    sellRules.adxThreshold != null &&
    adx > sellRules.adxThreshold
  ) {
    sellReasons.push(`ADX above ${sellRules.adxThreshold}`);
  }

  if (
    buyRules.useStoch &&
    !Number.isNaN(stoch) &&
    buyRules.stochOversold != null &&
    stoch < buyRules.stochOversold
  ) {
    buyReasons.push(`Stochastic below ${buyRules.stochOversold}`);
  }
  if (
    sellRules.useStoch &&
    !Number.isNaN(stoch) &&
    sellRules.stochOverbought != null &&
    stoch > sellRules.stochOverbought
  ) {
    sellReasons.push(`Stochastic above ${sellRules.stochOverbought}`);
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
    result.reason = [...buyReasons, ...sellReasons, 'Conflicting signals'];
  }

  return result;
}

module.exports = { evaluateSignal };
