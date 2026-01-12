import { useState } from 'react';
import { verifyPin } from '../data/db';
import './PinScreen.css';

function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await verifyPin(pin);
      if (success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPin(value);
    setError('');
  };

  return (
    <div className="pin-screen">
      <div className="pin-container">
        <div className="pin-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="pin-title">ProjectPan</h1>
        <p className="pin-subtitle">Entrez votre code PIN</p>

        <form onSubmit={handleSubmit} className="pin-form">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={handlePinChange}
            placeholder="****"
            className="pin-input"
            autoFocus
            disabled={loading}
            minLength={4}
            maxLength={8}
          />

          {error && <p className="pin-error">{error}</p>}

          <button
            type="submit"
            className="pin-button"
            disabled={pin.length < 4 || loading}
          >
            {loading ? 'Vérification...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PinScreen;
