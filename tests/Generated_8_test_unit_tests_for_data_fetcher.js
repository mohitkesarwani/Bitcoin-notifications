```javascript
const { getBtcPrice } = require('../backend/utils/btcPriceFetcher'); // Assuming the path
const axios = require('axios');

jest.mock('axios');

describe('getBtcPrice', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch BTC price successfully', async () => {
    const mockResponse = { data: { bpi: { USD: { rate_float: 60000 } } } };
    axios.get.mockResolvedValue(mockResponse);

    const price = await getBtcPrice();
    expect(price).toBe(60000);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('https://api.coindesk.com/v1/bpi/currentprice.json');
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    await expect(getBtcPrice()).rejects.toThrow('Failed to fetch BTC price: API Error');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('https://api.coindesk.com/v1/bpi/currentprice.json');
  });

  it('should handle invalid API response (missing data) gracefully', async () => {
    const mockResponse = { data: {} }; // Missing 'bpi'
    axios.get.mockResolvedValue(mockResponse);

    await expect(getBtcPrice()).rejects.toThrow('Invalid BTC price data received');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('https://api.coindesk.com/v1/bpi/currentprice.json');
  });

  it('should handle zero or negative price gracefully', async () => {
    const mockResponse = { data: { bpi: { USD: { rate_float: 0 } } } };
    axios.get.mockResolvedValue(mockResponse);

    const price = await getBtcPrice();
    expect(price).toBe(0);

  });

  it('should handle non-numeric price gracefully', async () => {
    const mockResponse = { data: { bpi: { USD: { rate_float: 'abc' } } } };
    axios.get.mockResolvedValue(mockResponse);

    await expect(getBtcPrice()).rejects.toThrow('Invalid BTC price data received');
  });

  it('should retry on intermittent API errors (optional)', async () => {
    // Simulate an intermittent error followed by success
    axios.get
      .mockRejectedValueOnce(new Error('Temporary API error'))
      .mockResolvedValue({ data: { bpi: { USD: { rate_float: 60000 } } } });

    const price = await getBtcPrice();
    expect(price).toBe(60000);
    expect(axios.get).toHaveBeenCalledTimes(2); // Called twice due to retry
  }, 10000);
});
```;
