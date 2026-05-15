/**
 * Short two-tone chime for new order alerts (no external audio file required).
 */
export function playNewOrderChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const makeBeep = (freq: number, when: number, duration: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.12;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(when);
      o.stop(when + duration);
    };
    const t0 = ctx.currentTime;
    makeBeep(880, t0, 0.12);
    makeBeep(1174, t0 + 0.1, 0.15);
    setTimeout(() => {
      void ctx.close();
    }, 500);
  } catch {
    // Web Audio may be blocked until user gesture; ignore.
  }
}
