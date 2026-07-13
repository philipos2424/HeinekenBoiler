import { useEffect, useState } from 'react';
import { apiPost, apiDelete } from '../../lib/api.js';

export default function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/staff', { credentials: 'same-origin' });
    const data = await res.json();
    setStaff(data.staff ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createStaff(e) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const { ok, data } = await apiPost('/api/admin/staff', { username, password });
    setCreating(false);
    if (!ok) {
      setError(data?.error ?? 'Could not create staff account.');
      return;
    }
    setUsername('');
    setPassword('');
    load();
  }

  async function revoke(id) {
    if (!confirm("Revoke this staff account? They'll be logged out immediately.")) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
    await apiDelete(`/api/admin/staff/${id}`);
  }

  return (
    <div>
      <p className="ad-hint">
        Staff accounts can only access the entrance scanner at <span className="ad-mono">/scan/login</span>, nothing else in admin.
      </p>

      <form onSubmit={createStaff} className="ad-staff-form">
        <div className="ad-staff-field">
          <label className="ad-staff-label" htmlFor="staff-username">Username</label>
          <input id="staff-username" value={username} onChange={(e) => setUsername(e.target.value)} required className="ad-search" />
        </div>
        <div className="ad-staff-field">
          <label className="ad-staff-label" htmlFor="staff-password">Password</label>
          <input id="staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="ad-search" />
        </div>
        <button type="submit" disabled={creating} className="ad-add-staff-btn">
          {creating ? 'Adding…' : 'Add Staff'}
        </button>
      </form>

      {error && <p className="ad-form-error">{error}</p>}

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="ad-td-name">{s.username}</td>
                <td className="ad-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => revoke(s.id)} className="ad-revoke-btn">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && staff.length === 0 && <p className="ad-empty">Loading…</p>}
        {!loading && staff.length === 0 && <p className="ad-empty">No staff accounts yet.</p>}
      </div>
    </div>
  );
}
