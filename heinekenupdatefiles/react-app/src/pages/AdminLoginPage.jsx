import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../lib/api.js';

const LOGO = '/assets/heineken-ethiopia-logo.png';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    const { ok, data } = await apiPost('/api/admin/login', { password });
    setPending(false);
    if (!ok) {
      setError(data?.error ?? 'Incorrect password.');
      return;
    }
    navigate('/admin/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="eb-grain-dark" aria-hidden="true" />
      <div className="auth-card">
        <img src={LOGO} alt="HEINEKEN Ethiopia" className="auth-logo" />
        <h1 className="auth-title">Admin Sign In</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label" htmlFor="password">Admin Password</label>
          <input
            id="password"
            type="password"
            className="auth-input"
            autoFocus
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
