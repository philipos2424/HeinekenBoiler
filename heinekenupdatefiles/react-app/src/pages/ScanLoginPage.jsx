import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../lib/api.js';

const LOGO = '/assets/heineken-ethiopia-logo.png';

export default function ScanLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    const { ok, data } = await apiPost('/api/scan/login', { username, password });
    setPending(false);
    if (!ok) {
      setError(data?.error ?? 'Incorrect username or password.');
      return;
    }
    navigate('/scan/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="eb-grain-dark" aria-hidden="true" />
      <div className="auth-card">
        <img src={LOGO} alt="HEINEKEN Ethiopia" className="auth-logo" />
        <h1 className="auth-title">Staff Scanner Sign In</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="auth-input"
            autoFocus
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="auth-input"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
