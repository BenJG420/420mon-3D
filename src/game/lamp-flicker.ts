const seeded = (value: number) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

/** A soft electrical stumble, twice at most per 9–17 seconds; never a blackout. */
export function lampFlicker(seed: number, seconds: number): number {
  if (!Number.isFinite(seed) || !Number.isFinite(seconds)) return 1;
  const period = 9 + seeded(seed + 7) * 8;
  const shifted = seconds + seeded(seed + 31) * period;
  const phase = ((shifted % period) + period) % period;
  const dip = (start: number, duration: number) => {
    const t = (phase - start) / duration;
    return t > 0 && t < 1 ? Math.sin(t * Math.PI) ** 2 : 0;
  };
  const drift = .98 + .02 * Math.sin(seconds * .47 + seeded(seed) * Math.PI * 2);
  return Math.max(.35, Math.min(1, drift - .6 * dip(1, .5) - .22 * dip(2.1, .3)));
}
