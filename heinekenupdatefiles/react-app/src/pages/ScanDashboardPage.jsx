import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScannerView from '../components/scan/ScannerView.jsx';
import { apiPost } from '../lib/api.js';

export default function ScanDashboardPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/scan/me', { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) {
          navigate('/scan/login');
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => navigate('/scan/login'));
  }, [navigate]);

  async function logout() {
    await apiPost('/api/scan/logout');
    navigate('/scan/login');
  }

  if (!authChecked) return <div className="sc-page sc-checking">Checking session…</div>;

  return (
    <div className="sc-page">
      <div className="sc-header">
        <h1 className="sc-header-title">Entrance Scanner</h1>
        <button type="button" onClick={logout} className="sc-logout-btn">Log Out</button>
      </div>
      <ScannerView />
    </div>
  );
}
