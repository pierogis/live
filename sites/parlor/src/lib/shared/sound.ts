/* Tiny synth blips, no sound files. */

let actx: AudioContext | null = null;

/** A short blip; `i` steps the pitch up so a run of landings rises. */
export function blip(i: number, soft = false) {
	try {
		actx = actx || new AudioContext();
		const t = actx.currentTime;
		const o = actx.createOscillator();
		const g = actx.createGain();
		const f = (soft ? 330 : 520) * Math.pow(2, (i % 12) / 24);
		o.type = 'triangle';
		o.frequency.setValueAtTime(f, t);
		o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.08);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(soft ? 0.04 : 0.07, t + 0.005);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
		o.connect(g).connect(actx.destination);
		o.start(t);
		o.stop(t + 0.12);
	} catch {
		/* audio not available */
	}
}
