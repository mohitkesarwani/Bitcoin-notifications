import { useEffect, useState } from 'react';

const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];

export default function App() {
  const [config, setConfig] = useState({
    alertEmail: '',
    rsiBuyThreshold: 30,
    rsiSellThreshold: 70,
    macdSignal: 0,
    adxMinStrength: 20,
    cciBuyThreshold: 100,
    cciSellThreshold: -100,
    stochBuyThreshold: 20,
    stochSellThreshold: 80,
    enabledCoins: [],
  });

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${apiUrl}/config`)
      .then((r) => r.json())
      .then((data) => setConfig((c) => ({ ...c, ...data })))
      .catch(console.error);
  }, [apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCoin = (coin) => {
    setConfig((prev) => {
      const enabled = prev.enabledCoins.includes(coin)
        ? prev.enabledCoins.filter((c) => c !== coin)
        : [...prev.enabledCoins, coin];
      return { ...prev, enabledCoins: enabled };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${apiUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trading Config</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Alert Email
            <input name="alertEmail" value={config.alertEmail} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            RSI Buy
            <input name="rsiBuyThreshold" value={config.rsiBuyThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            RSI Sell
            <input name="rsiSellThreshold" value={config.rsiSellThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            MACD Signal
            <input name="macdSignal" value={config.macdSignal} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            ADX Min Strength
            <input name="adxMinStrength" value={config.adxMinStrength} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            CCI Buy
            <input name="cciBuyThreshold" value={config.cciBuyThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            CCI Sell
            <input name="cciSellThreshold" value={config.cciSellThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            STOCH Buy
            <input name="stochBuyThreshold" value={config.stochBuyThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            STOCH Sell
            <input name="stochSellThreshold" value={config.stochSellThreshold} onChange={handleChange} />
          </label>
        </div>
        <div>
          <span>Coins:</span>
          {coins.map((coin) => (
            <label key={coin} style={{ marginLeft: 10 }}>
              <input
                type="checkbox"
                checked={config.enabledCoins.includes(coin)}
                onChange={() => toggleCoin(coin)}
              />
              {coin}
            </label>
          ))}
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
