import { useCallback, useEffect, useState } from 'react';
import { apiPatch } from '../../lib/api.js';

const RESPONSE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DECLINED', label: 'Declined' },
  { key: 'NONE', label: 'No Response' },
];

function ResponseBadge({ response }) {
  if (response === 'ACCEPTED') return <span className="ad-badge ad-badge--green">Accepted</span>;
  if (response === 'DECLINED') return <span className="ad-badge ad-badge--gray">Declined</span>;
  return <span className="ad-badge ad-badge--muted">No Response</span>;
}

export default function AttendeesTab() {
  const [attendees, setAttendees] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [responseFilter, setResponseFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [resending, setResending] = useState(null);

  const load = useCallback(async (searchTerm, filter, reset, cursorValue) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (filter !== 'ALL') params.set('response', filter);
    if (!reset && cursorValue) params.set('cursor', cursorValue);
    const res = await fetch(`/api/admin/attendees?${params.toString()}`, { credentials: 'same-origin' });
    const data = await res.json();
    setAttendees((prev) => (reset ? data.attendees : [...prev, ...data.attendees]));
    setCursor(data.nextCursor);
    setHasMore(Boolean(data.nextCursor));
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search, responseFilter, true), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, responseFilter]);

  async function toggleBlocked(id, blocked) {
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, blocked } : a)));
    await apiPatch(`/api/admin/attendees/${id}`, { blocked });
  }

  async function resendEmail(id) {
    setResending(id);
    const res = await fetch(`/api/admin/attendees/${id}/resend-email`, { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    setResending(null);
    if (data.attendee) {
      setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.attendee } : a)));
    }
  }

  return (
    <div>
      <div className="ad-toolbar">
        <p className="ad-count"><span>{total}</span> matching</p>
        <div className="ad-toolbar-actions">
          <input
            type="search"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-search"
          />
          <a href="/api/admin/attendees/export" className="ad-export-btn">Export CSV</a>
        </div>
      </div>

      <div className="ad-filters">
        {RESPONSE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setResponseFilter(f.key)}
            className={`ad-filter-btn ${responseFilter === f.key ? 'is-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Dietary</th>
              <th>Response</th>
              <th>Checked In</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a) => (
              <tr key={a.id} className={a.blocked ? 'ad-row--blocked' : ''}>
                <td className="ad-td-name">{a.fullName}</td>
                <td>{a.phone}</td>
                <td>{a.dietary ?? '—'}</td>
                <td><ResponseBadge response={a.response} /></td>
                <td>
                  {a.checkedInAt ? (
                    <span className="ad-checked">{new Date(a.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  ) : (
                    <span className="ad-muted">Not yet</span>
                  )}
                </td>
                <td>
                  {a.response === 'ACCEPTED' && a.email ? (
                    a.confirmationEmailSentAt && !a.confirmationEmailError ? (
                      <span className="ad-muted-sm">Sent</span>
                    ) : (
                      <button type="button" onClick={() => resendEmail(a.id)} disabled={resending === a.id} className="ad-resend-btn">
                        {resending === a.id ? 'Sending…' : 'Resend Email'}
                      </button>
                    )
                  ) : (
                    <span className="ad-muted-sm">—</span>
                  )}
                </td>
                <td>
                  <button type="button" onClick={() => toggleBlocked(a.id, !a.blocked)} className={`ad-block-btn ${a.blocked ? 'is-blocked' : ''}`}>
                    {a.blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && attendees.length === 0 && <p className="ad-empty">Loading…</p>}
        {!loading && attendees.length === 0 && <p className="ad-empty">No attendees found.</p>}
      </div>

      {hasMore && (
        <div className="ad-loadmore-wrap">
          <button type="button" onClick={() => load(search, responseFilter, false, cursor)} disabled={loading} className="ad-loadmore-btn">
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
