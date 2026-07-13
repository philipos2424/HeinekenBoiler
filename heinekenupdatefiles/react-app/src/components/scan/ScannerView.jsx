import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const SCAN_COOLDOWN_MS = 2500;

async function checkIn(attendeeId) {
  const res = await fetch(`/api/scan/checkin/${attendeeId}`, { method: 'POST', credentials: 'same-origin' });
  if (res.status === 404) return { kind: 'not_found' };
  const data = await res.json();
  if (data.status === 'checked_in') return { kind: 'checked_in', name: data.attendee.fullName };
  if (data.status === 'already_checked_in') {
    return {
      kind: 'already_checked_in',
      name: data.attendee.fullName,
      at: new Date(data.attendee.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  }
  if (data.status === 'not_accepted') {
    return { kind: 'not_accepted', name: data.attendee.fullName, response: data.attendee.response };
  }
  return { kind: 'error', message: 'Something went wrong. Please try again.' };
}

function ResultBanner({ result }) {
  const cls = {
    checked_in: 'sc-banner--ok',
    already_checked_in: 'sc-banner--warn',
    not_accepted: 'sc-banner--err',
    not_found: 'sc-banner--err',
    error: 'sc-banner--err',
  }[result.kind];

  const message =
    result.kind === 'checked_in'
      ? `✓ Checked in: ${result.name}`
      : result.kind === 'already_checked_in'
        ? `Already checked in: ${result.name} at ${result.at}`
        : result.kind === 'not_accepted'
          ? `${result.name} ${result.response === 'DECLINED' ? 'declined this event' : 'has no confirmed RSVP'}`
          : result.kind === 'not_found'
            ? 'Not found — check the code or search manually'
            : result.message;

  return <div className={`sc-banner ${cls}`}>{message}</div>;
}

export default function ScannerView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null);
  const cooldownUntil = useRef(0);
  const processing = useRef(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleDecoded = useCallback(async (text) => {
    if (processing.current || Date.now() < cooldownUntil.current) return;

    let attendeeId = null;
    try {
      attendeeId = new URL(text).searchParams.get('a');
    } catch {
      return;
    }
    if (!attendeeId) return;

    processing.current = true;
    const res = await checkIn(attendeeId);
    setResult(res);
    cooldownUntil.current = Date.now() + SCAN_COOLDOWN_MS;
    processing.current = false;
  }, []);

  useEffect(() => {
    let stream = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch {
        setCameraError("Couldn't access the camera. You can still check guests in with the search box below.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) handleDecoded(code.data);
        }
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [handleDecoded]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/scan/search?q=${encodeURIComponent(query)}`, { credentials: 'same-origin' });
      const data = await res.json();
      setSearchResults(data.attendees ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function manualCheckIn(attendeeId) {
    const res = await checkIn(attendeeId);
    setResult(res);
  }

  return (
    <div className="sc-view">
      <div className="sc-camera">
        <video ref={videoRef} className="sc-video" muted playsInline />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {cameraError && <div className="sc-camera-error">{cameraError}</div>}
      </div>

      {result && <ResultBanner result={result} />}

      <div className="sc-search-wrap">
        <label htmlFor="scan-search" className="sc-search-label">Or search by name / phone</label>
        <input
          id="scan-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Selam Tesfaye"
          className="sc-search-input"
        />
        {searching && <p className="sc-searching">Searching…</p>}
        {searchResults.length > 0 && (
          <ul className="sc-results">
            {searchResults.map((a) => (
              <li key={a.id} className="sc-result-row">
                <div>
                  <p className="sc-result-name">{a.fullName}</p>
                  <p className="sc-result-meta">
                    {a.phone} ·{' '}
                    {a.response === 'DECLINED'
                      ? 'Declined'
                      : a.response === 'ACCEPTED'
                        ? a.checkedInAt ? 'Checked in' : 'Accepted'
                        : 'No response'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => manualCheckIn(a.id)}
                  disabled={a.response !== 'ACCEPTED' || Boolean(a.checkedInAt)}
                  className="sc-checkin-btn"
                >
                  {a.checkedInAt ? 'Checked In' : 'Check In'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
