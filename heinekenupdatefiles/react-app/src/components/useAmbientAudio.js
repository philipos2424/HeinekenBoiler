import { useEffect, useRef, useState } from 'react';

/** Generated ambient drone via Web Audio; starts on first user gesture. */
export default function useAmbientAudio() {
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const audio = useRef({ ctx: null, master: null, started: false });

  useEffect(() => { onRef.current = on; }, [on]);

  const initAudio = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    audio.current.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    audio.current.master = master;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 850; filter.Q.value = 0.5;
    filter.connect(master);
    [110, 164.81, 220, 277.18].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.14 / (i + 1);
      o.connect(g); g.connect(filter); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain); lfoGain.connect(master.gain); lfo.start();
    master.gain.setTargetAtTime(onRef.current ? 0.13 : 0, ctx.currentTime, 2.2);
  };

  useEffect(() => {
    const start = () => {
      if (audio.current.started || !onRef.current) return;
      audio.current.started = true;
      try { initAudio(); } catch (e) { /* no-op */ }
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      try { audio.current.ctx && audio.current.ctx.close(); } catch (e) { /* no-op */ }
    };
  }, []);

  const toggle = () => {
    const next = !onRef.current;
    setOn(next);
    const a = audio.current;
    if (!a.ctx) {
      if (next) { a.started = true; try { initAudio(); } catch (e) { /* no-op */ } }
      return;
    }
    if (a.ctx.state === 'suspended') a.ctx.resume();
    a.master.gain.setTargetAtTime(next ? 0.13 : 0, a.ctx.currentTime, 0.4);
  };

  return { on, toggle };
}
