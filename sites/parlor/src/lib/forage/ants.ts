/*
 * Ants walking between the working slots and the picture: sprites (see
 * shared/game/sprites.ts), timed to the engine's walking ticks.
 * Each ant follows the path the engine found for it, so what you see is what
 * takes the time.
 */
import { canAnimate, Sprites } from '../shared/game/sprites';

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

/**
 * The ants on the board, drawn into `layer`. It knows which blocks a drawn ant
 * is still on its way to, so the board keeps them in sight until it gets there:
 * the engine's clock and the animations' can drift a little apart.
 */
export class AntLayer extends Sprites {
	#layer: HTMLElement;
	#arrived: (hex: string) => void;
	/** Blocks a drawn ant is still walking to. */
	readonly bound = new Set<number>();
	/** How many drawn ants of each color are still walking to their blocks. */
	#coming = new Map<string, number>();

	/** `arrived` is called with its color whenever a drawn ant gets to its block. */
	constructor(layer: HTMLElement, arrived: (hex: string) => void) {
		super();
		this.#layer = layer;
		this.#arrived = arrived;
	}

	/** One ant: along `path` to block `cell` over `ms`, then back the same way. */
	run(path: Point[], cell: number, ms: number, hex: string, size: number) {
		if (this.size >= MAX_ANTS || path.length < 2 || !canAnimate()) return;
		const origin = path[0];
		const node = document.createElement('div');
		node.className = 'ant';
		node.style.cssText = `--size:${size}px;--crumb:${hex};left:${origin.x}px;top:${origin.y}px`;
		const ant = this.add(this.#layer, node);
		this.bound.add(cell);
		this.#coming.set(hex, this.coming(hex) + 1);

		const duration = Math.max(100, ms);
		const out = this.animate(ant, frames(path, origin), { duration, fill: 'forwards' });
		out.onfinish = () => {
			this.bound.delete(cell);
			this.#coming.set(hex, this.coming(hex) - 1);
			this.#arrived(hex);
			const back = this.animate(ant, frames([...path].reverse(), origin), {
				duration,
				fill: 'forwards'
			});
			back.onfinish = () => this.drop(ant);
		};
	}

	/** How many drawn ants of color `hex` are still on their way. */
	coming(hex: string): number {
		return this.#coming.get(hex) ?? 0;
	}

	clear() {
		super.clear();
		this.bound.clear();
		this.#coming.clear();
	}
}
