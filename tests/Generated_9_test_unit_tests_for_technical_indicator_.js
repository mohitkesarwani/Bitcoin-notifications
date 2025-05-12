```javascript
describe('Technical Indicator Calculation', () => {
  const { calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } = require('../utils/technicalIndicators'); // Assuming the functions are in this file

  describe('calculateEMA', () => {
    it('should calculate EMA correctly', () => {
      const data = [10, 12, 13, 14, 15];
      const period = 3;
      const result = calculateEMA(data, period);
      expect(result).toBeCloseTo(13.75); // Expected value, adjust based on your implementation
    });

    it('should handle empty data array', () => {
      const data = [];
      const period = 3;
      const result = calculateEMA(data, period);
      expect(result).toEqual([]);
    });

    it('should handle period greater than data length', () => {
      const data = [10, 12];
      const period = 3;
      const result = calculateEMA(data, period);
      expect(result).toEqual([10,11]);
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly', () => {
      const data = [45, 48, 49, 46, 43, 47, 50, 52, 51, 49];
      const period = 14;
      const result = calculateRSI(data, period);
      expect(result[result.length -1]).toBeCloseTo(57.23); // Expected value, adjust based on your implementation
    });

    it('should handle empty data array', () => {
      const data = [];
      const period = 14;
      const result = calculateRSI(data, period);
      expect(result).toEqual([]);
    });

    it('should handle period greater than data length', () => {
      const data = [45, 48];
      const period = 14;
      const result = calculateRSI(data, period);
      expect(result).toEqual([
        50
      ]);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      const data = [82, 85, 84, 86, 89, 92, 90, 88, 85, 83];
      const fastPeriod = 12;
      const slowPeriod = 26;
      const signalPeriod = 9;
      const result = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
      expect(result[result.length-1].MACD).toBeCloseTo(-0.15);
      expect(result[result.length-1].signal).toBeCloseTo(0.42)
    });

    it('should handle empty data array', () => {
      const data = [];
       const fastPeriod = 12;
       const slowPeriod = 26;
       const signalPeriod = 9;
      const result = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
      expect(result).toEqual([]);
    });

    it('should handle periods greater than data length', () => {
      const data = [82, 85];
       const fastPeriod = 12;
       const slowPeriod = 26;
       const signalPeriod = 9;
      const result = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
      expect(result).toEqual([]);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const data = [10, 12, 13, 14, 15, 16, 15, 14, 13, 12];
      const period = 5;
      const stdDev = 2;
      const result = calculateBollingerBands(data, period, stdDev);
      expect(result[result.length - 1].upper).toBeCloseTo(16.32); // Expected value, adjust based on your implementation
      expect(result[result.length - 1].lower).toBeCloseTo(11.68); // Expected value, adjust based on your implementation
      expect(result[result.length - 1].mid).toBeCloseTo(13.6);
    });

    it('should handle empty data array', () => {
      const data = [];
      const period = 5;
      const stdDev = 2;
      const result = calculateBollingerBands(data, period, stdDev);
      expect(result).toEqual([]);
    });

    it('should handle period greater than data length', () => {
      const data = [10, 12, 13];
      const period = 5;
      const stdDev = 2;
      const result = calculateBollingerBands(data, period, stdDev);
      expect(result).toEqual([]);
    });

    it('should handle stdDev of 0', () => {
        const data = [10, 12, 13, 14, 15, 16, 15, 14, 13, 12];
        const period = 5;
        const stdDev = 0;
        const result = calculateBollingerBands(data, period, stdDev);
        expect(result[result.length - 1].upper).toBeCloseTo(13.6);
        expect(result[result.length - 1].lower).toBeCloseTo(13.6);
        expect(result[result.length - 1].mid).toBeCloseTo(13.6);
      });
  });
});
```;
