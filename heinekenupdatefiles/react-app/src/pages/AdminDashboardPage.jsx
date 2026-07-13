import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsTab from '../components/admin/AnalyticsTab.jsx';
import AttendeesTab from '../components/admin/AttendeesTab.jsx';
import StaffTab from '../components/admin/StaffTab.jsx';
import { apiPost } from '../lib/api.js';

const TABS = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'rsvp', label: 'RSVPs' },
  { key: 'staff', label: 'Staff' },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('analytics');

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'same-origin' }).then((res) => {
      if (!res.ok) {
        navigate('/admin/login');
        return;
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  async function logout() {
    await apiPost('/api/admin/logout');
    navigate('/admin/login');
  }

  if (!authChecked) return null;

  return (
    <div className="ad-page">
      <div className="ad-header">
        <h1 className="ad-header-title">Admin Dashboard</h1>
        <button type="button" onClick={logout} className="ad-logout-btn">Log Out</button>
      </div>

      <div className="ad-body">
        <div className="ad-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`ad-tab-btn ${tab === t.key ? 'is-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'rsvp' && <AttendeesTab />}
        {tab === 'staff' && <StaffTab />}
      </div>
    </div>
  );
}
