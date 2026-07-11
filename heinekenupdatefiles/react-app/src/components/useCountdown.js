import { useEffect, useState } from 'react';

const p2 = (x) => String(x).padStart(2, '0');

/** Live countdown to the given target Date, as zero-padded strings. */
export default function useCountdown(target) {
  const compute = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      days: p2(Math.floor(diff / 86400000)),
      hours: p2(Math.floor(diff / 3600000) % 24),
      mins: p2(Math.floor(diff / 60000) % 60),
      secs: p2(Math.floor(diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setT(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return t;
}
