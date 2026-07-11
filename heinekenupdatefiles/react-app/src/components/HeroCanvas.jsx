import { useEffect, useRef } from 'react';

/** Rising gold/green particle field behind the hero. */
export default function HeroCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 64;
    const mk = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 12,
      r: Math.random() * 2.2 + 0.5,
      s: Math.random() * 0.5 + 0.12,
      dr: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
      g: Math.random() < 0.32,
    });
    const P = Array.from({ length: N }, () => mk(true));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.s; p.x += p.dr;
        if (p.y < -14) Object.assign(p, mk(false));
        const col = p.g ? '124,255,176' : '214,189,119';
        const rad = p.r * 4;
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        gr.addColorStop(0, `rgba(${col},${p.a})`);
        gr.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="eb-hero-canvas" />;
}
