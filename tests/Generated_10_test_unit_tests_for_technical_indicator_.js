```javascript
const { calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } = require('../utils/technicalIndicators'); // Assuming the functions are in this file

describe('Technical Indicator Functions', () => {
  describe('calculateEMA', () => {
    it('should calculate EMA correctly for a given period', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const period = 3;
      const emaValues = calculateEMA(prices, period);
      expect(emaValues.length).toBe(prices.length - period + 1);
    });

    it('should handle an empty prices array', () => {
      const prices = [];
      const period = 3;
      const emaValues = calculateEMA(prices, period);
      expect(emaValues).toEqual([]);
    });

    it('should return an empty array if period is larger than prices length', () => {
      const prices = [1, 2, 3];
      const period = 5;
      const emaValues = calculateEMA(prices, period);
      expect(emaValues).toEqual([]);
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for a given period', () => {
      const prices = [10, 12, 15, 13, 16, 18, 17, 19, 20, 22];
      const period = 14;
      const rsiValues = calculateRSI(prices, period);
      expect(rsiValues.length).toBe(prices.length - period);
    });

    it('should handle an empty prices array', () => {
      const prices = [];
      const period = 14;
      const rsiValues = calculateRSI(prices, period);
      expect(rsiValues).toEqual([]);
    });

    it('should return an empty array if period is larger than prices length', () => {
      const prices = [1, 2, 3];
      const period = 5;
      const rsiValues = calculateRSI(prices, period);
      expect(rsiValues).toEqual([]);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly with default periods', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
      const macdValues = calculateMACD(prices);
      expect(macdValues.macd.length).toBe(prices.length - 26 + 1);
      expect(macdValues.signal.length).toBe(prices.length - 26 + 1);
      expect(macdValues.histogram.length).toBe(prices.length - 26 + 1);
    });

    it('should calculate MACD correctly with custom periods', () => {
        const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
        const macdValues = calculateMACD(prices, 5, 10, 3);
        expect(macdValues.macd.length).toBe(prices.length - 15 + 1);
        expect(macdValues.signal.length).toBe(prices.length - 15 + 1);
        expect(macdValues.histogram.length).toBe(prices.length - 15 + 1);
      });

    it('should handle an empty prices array', () => {
      const prices = [];
      const macdValues = calculateMACD(prices);
      expect(macdValues.macd).toEqual([]);
      expect(macdValues.signal).toEqual([]);
      expect(macdValues.histogram).toEqual([]);
    });

    it('should return empty arrays if prices length is insufficient', () => {
      const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // insufficient length for default 12/26/9
      const macdValues = calculateMACD(prices);
      expect(macdValues.macd).toEqual([]);
      expect(macdValues.signal).toEqual([]);
      expect(macdValues.histogram).toEqual([]);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly for a given period and standard deviation', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const period = 20;
      const stdDev = 2;
      const bollingerBands = calculateBollingerBands(prices, period, stdDev);
      expect(bollingerBands.upper.length).toBe(prices.length - period + 1);
      expect(bollingerBands.middle.length).toBe(prices.length - period + 1);
      expect(bollingerBands.lower.length).toBe(prices.length - period + 1);
    });

    it('should handle an empty prices array', () => {
      const prices = [];
      const period = 20;
      const stdDev = 2;
      const bollingerBands = calculateBollingerBands(prices, period, stdDev);
      expect(bollingerBands.upper).toEqual([]);
      expect(bollingerBands.middle).toEqual([]);
      expect(bollingerBands.lower).toEqual([]);
    });

    it('should return empty arrays if period is larger than prices length', () => {
      const prices = [1, 2, 3];
      const period = 5;
      const stdDev = 2;
      const bollingerBands = calculateBollingerBands(prices, period, stdDev);
      expect(bollingerBands.upper).toEqual([]);
      expect(bollingerBands.middle).toEqual([]);
      expect(bollingerBands.lower).toEqual([]);
    });

    it('should handle zero standard deviation', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const period = 20;
      const stdDev = 0;
      const bollingerBands = calculateBollingerBands(prices, period, stdDev);
      expect(bollingerBands.upper.length).toBe(prices.length - period + 1);
      expect(bollingerBands.middle.length).toBe(prices.length - period + 1);
      expect(bollingerBands.lower.length).toBe(prices.length - period + 1);
      bollingerBands.upper.forEach((val, index) => {
        expect(val).toBe(bollingerBands.middle[index])
      })
      bollingerBands.lower.forEach((val, index) => {
        expect(val).toBe(bollingerBands.middle[index])
      })
    });
  });
});
```;
