/*
 * Ants walking between the working slots and the picture. They're short-lived
 * nodes in an overlay layer that Svelte doesn't render, so they're plain DOM,
 * animated with the Web Animations API and timed to the engine's walking ticks.
 * Each ant follows the path the engine found for it, so what you see is what
 * takes the time.
 */

type Point = { x: number; y: number };

const MAX_ANTS = 260;

/** Keep only the points where the path turns, so a long straight walk is one step. */
function corners(path: Point[]): Point[] {
	if (path.length < 3) return path;
	const out = [path[0]];
	for (let k = 1; k < path.length - 1; k++) {
		const a = out[out.length - 1];
		const b = path[k];
		const c = path[k + 1];
		const turn = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
		if (Math.abs(turn) > 0.01) out.push(b);
	}
	out.push(path[path.length - 1]);
	return out;
}

/** Keyframes that move at an even speed along `path`, relative to `origin`. */
function frames(path: Point[], origin: Point): Keyframe[] {
	const pts = corners(path);
	const lengths = [0];
	for (let k = 1; k < pts.length; k++) {
		lengths.push(lengths[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
	}
	const total = lengths[lengths.length - 1] || 1;
	return pts.map((p, k) => ({
		transform: `translate(${p.x - origin.x}px, ${p.y - origin.y}px)`,
		offset: lengths[k] / total
	}));
}

export class AntLayer {
	#layer: HTMLElement;
	#live = new Set<{ node: HTMLElement; anims: Animation[] }>();

	constructor(layer: HTMLElement) {
		this.#layer = layer;
	}

	/**
	 * One ant: along `path` to its food over `ms`, then back the same way carrying
	 * a bit of the food's color.
	 */
	run(path: Point[], ms: number, hex: string, size: number) {
		if (this.#live.size >= MAX_ANTS || path.length < 2 || !Element.prototype.animate) return;
		const origin = path[0];
		const node = document.createElement('div');
		node.className = 'ant';
		node.style.cssText = `--size:${size}px;--crumb:${hex};left:${origin.x}px;top:${origin.y}px`;
		this.#layer.append(node);
		const ant = { node, anims: [] as Animation[] };
		this.#live.add(ant);

		const duration = Math.max(100, ms);
		const out = node.animate(frames(path, origin), { duration, fill: 'forwards' });
		ant.anims.push(out);
		out.onfinish = () => {
			node.classList.add('carrying');
			const back = node.animate(frames([...path].reverse(), origin), {
				duration,
				fill: 'forwards'
			});
			ant.anims.push(back);
			back.onfinish = () => this.#drop(ant);
		};
	}

	clear() {
		for (const a of [...this.#live]) this.#drop(a);
	}

	#drop(a: { node: HTMLElement; anims: Animation[] }) {
		for (const anim of a.anims) {
			anim.onfinish = null;
			anim.cancel();
		}
		a.node.remove();
		this.#live.delete(a);
	}
}
