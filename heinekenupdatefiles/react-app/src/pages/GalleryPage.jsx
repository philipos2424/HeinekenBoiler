import { Link } from 'react-router-dom';

const LOGO = '/assets/heineken-ethiopia-logo.png';

function Slot({ text }) {
  return (
    <div className="eb-slot">
      <div className="eb-slot-inner">
        <span className="eb-slot-icon">✦</span>
        <span className="eb-slot-text">{text}</span>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const highlights = [1, 2, 3, 4, 5];
  return (
    <div className="g-page">
      <div className="eb-grain-light" aria-hidden="true" />

      <header className="g-head">
        <img src={LOGO} alt="HEINEKEN Ethiopia" className="g-logo" />
        <Link to="/" className="g-back"><span>←</span> Back to invitation</Link>
      </header>

      <section className="g-hero">
        <div className="g-hero-eyebrow-row">
          <span className="g-hero-star">★</span>
          <span className="g-hero-line" />
          <span className="g-hero-eyebrow">E-Boiler Unveiling · Memories</span>
        </div>
        <h1 className="g-h1">The <span className="g-h1-em">Gallery</span></h1>
        <p className="g-hero-p">
          Thank you for being part of a greener chapter. The official group photo and celebration
          highlights from July 28 will be published right here — a keepsake from the day we powered
          progress together.
        </p>
        <div className="g-pill">
          <span className="g-pill-dot" />
          Photos published after Tuesday, July 28, 2026
        </div>
      </section>

      <section className="g-section g-sec-featured">
        <div className="g-sec-titlerow">
          <span className="g-sec-title">The group photo</span>
          <span className="g-sec-rule" />
        </div>
        <div className="g-featured">
          <Slot text="The official group photo will appear here after the event" />
        </div>
      </section>

      <section className="g-section g-sec-highlights">
        <div className="g-sec-titlerow g-sec-titlerow--hl">
          <span className="g-sec-title">Highlights from the day</span>
          <span className="g-sec-rule" />
        </div>
        <div className="g-grid">
          {highlights.map((n) => (
            <div key={n} className="g-tile"><Slot text={`Highlight ${n}`} /></div>
          ))}
          <div className="g-more">
            <div>
              <div className="g-more-title">More<br />to come</div>
              <div className="g-more-sub">Stay tuned</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="g-footer">
        <div className="g-footer-logobox">
          <img src={LOGO} alt="HEINEKEN Ethiopia" className="g-footer-logo" />
        </div>
        <div className="g-footer-text">
          E-Boiler Unveiling · Brewing a greener future<br />© 2026 HEINEKEN Ethiopia
        </div>
      </footer>
    </div>
  );
}
