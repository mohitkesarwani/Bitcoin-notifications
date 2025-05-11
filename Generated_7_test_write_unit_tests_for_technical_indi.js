```javascript
const { calculateSMA, calculateEMA, calculateMACD } = require('../utils/technicalIndicators'); // Adjust path as needed

describe('Technical Indicator Calculations', () => {
  describe('calculateSMA', () => {
    it('should calculate the Simple Moving Average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const period = 3;
      const expectedSMA = [20, 30, 40]; // (10+20+30)/3, (20+30+40)/3, (30+40+50)/3
      const actualSMA = calculateSMA(data, period);
      expect(actualSMA).toEqual(expectedSMA);
    });

    it('should return an empty array if the period is greater than the data length', () => {
      const data = [10, 20];
      const period = 3;
      const actualSMA = calculateSMA(data, period);
      expect(actualSMA).toEqual([]);
    });

    it('should handle an empty data array', () => {
      const data = [];
      const period = 3;
      const actualSMA = calculateSMA(data, period);
      expect(actualSMA).toEqual([]);
    });

    it('should handle a period of 1', () => {
      const data = [10, 20, 30];
      const period = 1;
      const expectedSMA = [10, 20, 30];
      const actualSMA = calculateSMA(data, period);
      expect(actualSMA).toEqual(expectedSMA);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate the Exponential Moving Average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const period = 3;
      const initialSMA = calculateSMA(data.slice(0, period), period)[period - period];
      const expectedEMA = [
        initialSMA,
        (2/(period + 1) * (data[period] - initialSMA) + initialSMA),
        (2/(period + 1) * (data[period+1] - (2/(period + 1) * (data[period] - initialSMA) + initialSMA)) + (2/(period + 1) * (data[period] - initialSMA) + initialSMA))
      ];
      const calculatedEMA = calculateEMA(data.slice(period-1), period);
      expect(calculatedEMA[0]).toBeCloseTo(expectedEMA[0], 5); // initial SMA
      expect(calculatedEMA[1]).toBeCloseTo(expectedEMA[1], 5); // EMA for data[3]
      expect(calculatedEMA[2]).toBeCloseTo(expectedEMA[2], 5); // EMA for data[4]

    });

    it('should return an empty array if the period is greater than the data length', () => {
      const data = [10, 20];
      const period = 3;
      const actualEMA = calculateEMA(data, period);
      expect(actualEMA).toEqual([]);
    });

    it('should handle an empty data array', () => {
      const data = [];
      const period = 3;
      const actualEMA = calculateEMA(data, period);
      expect(actualEMA).toEqual([]);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      const data = [10, 20, 30, 40, 50, 40, 30, 20, 10];
      const fastPeriod = 3;
      const slowPeriod = 6;
      const { macd, signal, histogram } = calculateMACD(data, fastPeriod, slowPeriod);

      expect(macd).toBeDefined();
      expect(signal).toBeDefined();
      expect(histogram).toBeDefined();
      expect(macd.length).toBe(data.length - slowPeriod + 1); // Adjusted length
      expect(signal.length).toBe(macd.length - 8); // Signal line is 9-day EMA of MACD, which starts later. This -8 can be - signalPeriod + 1 - 1 (which is default = 9) -1
      expect(histogram.length).toBe(signal.length);
    });

    it('should handle data length smaller than slow period', () => {
      const data = [10, 20, 30, 40];
      const fastPeriod = 3;
      const slowPeriod = 6;
      const { macd, signal, histogram } = calculateMACD(data, fastPeriod, slowPeriod);
      expect(macd).toEqual([]);
      expect(signal).toEqual([]);
      expect(histogram).toEqual([]);

    });

    it('should handle equal fast and slow periods', () => {
      const data = [10, 20, 30, 40, 50];
      const fastPeriod = 3;
      const slowPeriod = 3;
      const { macd, signal, histogram } = calculateMACD(data, fastPeriod, slowPeriod);

      expect(macd).toBeDefined();
      expect(signal).toBeDefined();
      expect(histogram).toBeDefined();
    });

    it('should handle empty data array', () => {
        const data = [];
        const fastPeriod = 3;
        const slowPeriod = 6;
        const { macd, signal, histogram } = calculateMACD(data, fastPeriod, slowPeriod);
        expect(macd).toEqual([]);
        expect(signal).toEqual([]);
        expect(histogram).toEqual([]);
      });
  });
});
```