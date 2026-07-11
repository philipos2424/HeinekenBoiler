import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCanvas from '../components/HeroCanvas.jsx';
import Reveal from '../components/Reveal.jsx';
import useCountdown from '../components/useCountdown.js';
import useAmbientAudio from '../components/useAmbientAudio.js';
import { makeBubbleStyles, LOADER_BUBBLE_COLORS, CHEER_BUBBLE_COLORS } from '../components/bubbles.js';

const LOGO = '/assets/heineken-ethiopia-logo.png';
const TARGET = new Date(2026, 6, 28, 14, 0, 0).getTime();
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function RsvpPage() {
  const [ready, setReady] = useState(false);
  const cd = useCountdown(TARGET);
  const music = useAmbientAudio();

  const [form, setForm] = useState({ name: '', email: '', phone: '', dietary: '', message: '' });
  const [attending, setAttending] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const loaderBubbles = useMemo(() => makeBubbleStyles(16, LOADER_BUBBLE_COLORS, false), []);
  const cheerBubbles = useMemo(() => makeBubbleStyles(32, CHEER_BUBBLE_COLORS, true), []);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 3600);
    return () => clearTimeout(id);
  }, []);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };
  const choose = (v) => { setAttending(v); setError(''); };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!attending) return setError('Please let us know whether you can attend.');
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(form.email)) return setError('Please enter a valid email address.');
    setError('');
    setSubmitted(true);
  };

  const isNo = attending === 'no';
  const celebrating = submitted && attending === 'yes';

  return (
    <div className="eb-page">
      {/* loader */}
      <div className={`eb-loader ${ready ? 'eb-loader--done' : ''}`}>
        <div className="eb-loader-bubbles">
          {loaderBubbles.map((s, i) => <span key={i} style={s} />)}
        </div>
        <div className="eb-loader-cardwrap">
          <div className="eb-loader-card">
            <img src={LOGO} alt="HEINEKEN Ethiopia" className="eb-loader-logo" />
            <span className="eb-loader-star">★</span>
          </div>
        </div>
        <div className="eb-loader-bar"><div className="eb-loader-barfill" /></div>
        <div className="eb-loader-tag">Brewing a greener future</div>
      </div>

      {/* music toggle */}
      <button
        type="button"
        aria-label="Toggle music"
        title={music.on ? 'Mute music' : 'Play music'}
        className={`eb-music ${music.on ? '' : 'eb-music--off'}`}
        onClick={music.toggle}
      >♪</button>

      <div className="eb-grain-dark" aria-hidden="true" />

      {/* hero */}
      <section className="eb-hero" aria-label="Hero">
        <HeroCanvas />
        <div className="eb-aurora" />

        <div className="eb-core">
          <span className="eb-pulse" style={{ animationDelay: '0s' }} />
          <span className="eb-pulse" style={{ animationDelay: '1.4s' }} />
          <span className="eb-pulse" style={{ animationDelay: '2.8s' }} />
          <div className="eb-ring eb-ring--a" />
          <div className="eb-ring eb-ring--b" />
          <div className="eb-orbit"><span /></div>
          <div className="eb-orbit2"><span /></div>
          <div className="eb-glow" />
        </div>

        <div className="eb-hero-grid">
          <div className="eb-hero-top">
            <div className="eb-hero-logobox">
              <img src={LOGO} alt="HEINEKEN Ethiopia" className="eb-hero-logo" />
            </div>
            <span className="eb-hero-inv">Invitation · 2026</span>
          </div>

          <div className="eb-hero-mid">
            <div className="eb-hero-kicker">
              <span className="eb-hero-kicker-star">★</span>
              <span className="eb-hero-kicker-line" />
              <span className="eb-hero-kicker-text">The E-Boiler Unveiling</span>
            </div>

            <h1 className="eb-h1">
              <span className="eb-h1-l1">You're</span>
              <span className="eb-shimmer">Invited</span>
            </h1>

            <p className="eb-hero-intro">
              A new chapter in sustainable brewing begins. Join us as we unveil HEINEKEN Ethiopia's
              first-ever E-Boiler — an innovation marking a major step toward a greener future.
            </p>

            <div className="eb-hero-ctarow">
              <a href="#rsvp" className="eb-cta">
                Reserve your place <span className="eb-cta-arrow">→</span>
              </a>
              <div className="eb-hero-meta">
                <div>
                  <div className="eb-hero-meta-label">Date</div>
                  <div className="eb-hero-meta-val">Tue · Jul 28</div>
                </div>
                <span className="eb-hero-meta-div" />
                <div>
                  <div className="eb-hero-meta-label">Time</div>
                  <div className="eb-hero-meta-val">2:00 – 6:00 PM</div>
                </div>
                <span className="eb-hero-meta-div" />
                <div>
                  <div className="eb-hero-meta-label">Venue</div>
                  <div className="eb-hero-meta-val">Kilinto Brewery</div>
                </div>
              </div>
            </div>
          </div>

          <div className="eb-scroll-row">
            <div className="eb-scrollline" />
            <span className="eb-scroll-text">Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* countdown */}
      <section className="eb-cd" aria-label="Countdown">
        <Reveal className="eb-cd-inner">
          <div className="eb-cd-eyebrow-row">
            <span className="eb-cd-line" />
            <span className="eb-cd-eyebrow">Counting down</span>
            <span className="eb-cd-line" />
          </div>
          <h2 className="eb-cd-title">until we power a greener future</h2>
          <div className="eb-cd-grid">
            <div className="eb-cd-unit">
              <div className="eb-cd-num eb-cd-num--flicker">{cd.days}</div>
              <div className="eb-cd-label">Days</div>
            </div>
            <div className="eb-cd-colon">:</div>
            <div className="eb-cd-unit">
              <div className="eb-cd-num">{cd.hours}</div>
              <div className="eb-cd-label">Hours</div>
            </div>
            <div className="eb-cd-colon">:</div>
            <div className="eb-cd-unit">
              <div className="eb-cd-num">{cd.mins}</div>
              <div className="eb-cd-label">Minutes</div>
            </div>
            <div className="eb-cd-colon">:</div>
            <div className="eb-cd-unit">
              <div className="eb-cd-num eb-cd-num--sec">{cd.secs}</div>
              <div className="eb-cd-label">Seconds</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* narrative */}
      <section className="eb-narr" aria-label="Narrative">
        <Reveal className="eb-narr-inner">
          <div className="eb-narr-eyebrow-row">
            <span className="eb-diamond" />
            <span className="eb-narr-eyebrow">From steam to electric</span>
            <span className="eb-diamond" />
          </div>
          <p className="eb-narr-text">
            Be part of this milestone as we celebrate <span className="eb-em-green">progress</span>,{' '}
            <span className="eb-em-gold">purpose</span>, and the power of innovation — a step toward
            brewing that gives more to the world than it takes.
          </p>
        </Reveal>
      </section>

      {/* details */}
      <section className="eb-det" aria-label="Details">
        <div className="eb-det-inner">
          <Reveal className="eb-det-titlerow">
            <span className="eb-det-title">The Details</span>
            <span className="eb-det-rule" />
          </Reveal>
          <Reveal className="eb-details-grid">
            <div className="eb-det-col">
              <div className="eb-det-label">Date</div>
              <div className="eb-det-val">Tuesday<br />July 28, 2026</div>
            </div>
            <div className="eb-det-col">
              <div className="eb-det-label">Time</div>
              <div className="eb-det-val">2:00&nbsp;PM<br />— 6:00&nbsp;PM</div>
            </div>
            <div className="eb-det-col">
              <div className="eb-det-label">Venue</div>
              <div className="eb-det-val">HEINEKEN<br />Kilinto Brewery</div>
            </div>
          </Reveal>
          <Reveal className="eb-note">
            <span className="eb-note-badge">!</span>
            <p className="eb-note-text">
              <strong>Please note:</strong> Evenings at Kilinto can be cool — kindly dress warmly and carry an umbrella.
            </p>
          </Reveal>
        </div>
      </section>

      {/* rsvp */}
      <section id="rsvp" className="eb-rsvp" aria-label="RSVP">
        <Reveal className="eb-rsvp-card">
          {!submitted ? (
            <form onSubmit={onSubmit} noValidate>
              <div className="eb-rsvp-head">
                <div className="eb-rsvp-eyebrow-row">
                  <span className="eb-rsvp-line" />
                  <span className="eb-rsvp-eyebrow">RSVP</span>
                  <span className="eb-rsvp-line" />
                </div>
                <h2 className="eb-rsvp-title">Kindly Respond</h2>
                <p className="eb-rsvp-sub">We'd be honored by your presence. Please reply by July 21.</p>
              </div>

              <div className="eb-field-block">
                <label className="eb-field-label">Will you attend?</label>
                <div className="eb-2col">
                  <button type="button" className={`eb-toggle-btn ${attending === 'yes' ? 'is-active' : ''}`} onClick={() => choose('yes')}>Joyfully accepts</button>
                  <button type="button" className={`eb-toggle-btn ${attending === 'no' ? 'is-active' : ''}`} onClick={() => choose('no')}>Regretfully declines</button>
                </div>
              </div>

              <div className="eb-fields-grid">
                <div className="eb-field">
                  <label className="eb-field-lbl" htmlFor="fName">Full name</label>
                  <input id="fName" type="text" className="eb-input" placeholder="Your name" autoComplete="name" value={form.name} onChange={set('name')} />
                </div>
                <div className="eb-field">
                  <label className="eb-field-lbl" htmlFor="fEmail">Email</label>
                  <input id="fEmail" type="email" className="eb-input" placeholder="name@email.com" autoComplete="email" value={form.email} onChange={set('email')} />
                </div>
                <div className="eb-field">
                  <label className="eb-field-lbl" htmlFor="fPhone">Phone</label>
                  <input id="fPhone" type="tel" className="eb-input" placeholder="+251 …" autoComplete="tel" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="eb-field">
                  <label className="eb-field-lbl" htmlFor="fDietary">Dietary preferences</label>
                  <input id="fDietary" type="text" className="eb-input" placeholder="Vegetarian, allergies…" value={form.dietary} onChange={set('dietary')} />
                </div>
              </div>

              <div className="eb-field eb-msg-field">
                <label className="eb-field-lbl" htmlFor="fMessage">Message <span className="eb-optional">(optional)</span></label>
                <textarea id="fMessage" rows="2" className="eb-input eb-textarea" placeholder="A note for the team…" value={form.message} onChange={set('message')} />
              </div>

              {error && <p className="eb-error">{error}</p>}

              <button type="submit" className="eb-submit">Send my RSVP</button>
            </form>
          ) : (
            <div className="eb-confirm">
              <div className="eb-confirm-badge">★</div>
              <h2 className="eb-confirm-title">{isNo ? "We'll miss you" : 'Thank you!'}</h2>
              <p className="eb-confirm-body">
                {isNo
                  ? "We're sorry you can't join us — thank you for letting us know. We hope to celebrate with you another time."
                  : "Your place is reserved. We can't wait to share this milestone with you. A confirmation will follow by email."}
              </p>
              <div className="eb-confirm-summary">
                <span><strong>Guest:</strong> {form.name.trim()}</span>
                <span><strong>Date:</strong> Tue, July 28 · 2:00–6:00 PM</span>
                <span><strong>Venue:</strong> HEINEKEN Kilinto Brewery</span>
              </div>

              <div className="eb-after">
                <div className="eb-after-eyebrow"><span className="eb-after-star">★</span> After the event</div>
                <p className="eb-after-text">
                  A little something to remember it by — the official group photo &amp; celebration
                  highlights will be published to our event gallery. Check back after July 28.
                </p>
                <Link to="/gallery" className="eb-gallery-link">Visit the event gallery <span style={{ fontSize: '15px' }}>→</span></Link>
              </div>

              <div className="eb-edit-wrap">
                <button type="button" className="eb-edit-btn" onClick={() => setSubmitted(false)}>Edit my response</button>
              </div>
            </div>
          )}
        </Reveal>
      </section>

      {/* celebration */}
      {celebrating && (
        <div className="eb-celebrate" aria-hidden="true">
          <div className="eb-celebrate-glow" />
          <div>{cheerBubbles.map((s, i) => <span key={i} style={s} />)}</div>
        </div>
      )}

      {/* footer */}
      <footer className="eb-footer">
        <div className="eb-footer-logobox">
          <img src={LOGO} alt="HEINEKEN Ethiopia" className="eb-footer-logo" />
        </div>
        <div className="eb-footer-text">
          E-Boiler Unveiling · Brewing a greener future<br />© 2026 HEINEKEN Ethiopia
        </div>
      </footer>
    </div>
  );
}
