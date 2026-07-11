/** Returns an array of inline-style objects for animated bubbles. */
export function makeBubbleStyles(n, colors, cover) {
  return Array.from({ length: n }, (_, i) => {
    const size = 5 + Math.random() * (cover ? 22 : 26);
    return {
      position: 'absolute',
      bottom: '-50px',
      left: Math.random() * 100 + '%',
      width: size + 'px',
      height: size + 'px',
      borderRadius: '50%',
      background: colors[i % colors.length],
      boxShadow: 'inset 0 2px 3px rgba(255,255,255,.35)',
      animation: `bubbleUp ${5 + Math.random() * 6}s linear ${Math.random() * (cover ? 2 : 5)}s infinite`,
    };
  });
}

export const LOADER_BUBBLE_COLORS = ['rgba(198,162,75,.55)', 'rgba(244,238,222,.4)', 'rgba(120,200,150,.4)'];
export const CHEER_BUBBLE_COLORS = ['rgba(0,132,61,.7)', 'rgba(198,162,75,.8)', 'rgba(228,0,43,.55)', 'rgba(244,238,222,.7)'];
