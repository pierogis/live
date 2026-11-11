/*
 * Ants walking between the working slots and the picture: sprites (see
 * shared/game/sprites.ts), timed to the engine's walking ticks.
 * Each ant follows the path the engine found for it, so what you see is what
 * takes the time. It walks in step with the music's beat: a stride each beat
 * line, quicker between and slower at them, its last stride ending on its block.
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

/** How much of a stride's speed rises and falls with the beat (0 walks evenly). */
const SWAY = 0.7;
/** Whether this browser takes `linear()` easings, which walking in step needs. */
let stepping: boolean | undefined;

/**
 * An easing for a walk of `duration` ms in strides of `stride` ms, counted back
 * from its end (`fromEnd`) or on from its start, each one easing in and out.
 * Each stride covers its share of the way, so the walk takes as long as before.
 */
function inStep(duration: number, stride: number, fromEnd: boolean): string {
	stepping ??=
		typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)');
	if (!stepping || duration < stride) return 'linear';
	const lines: number[] = [];
	if (fromEnd) for (let b = duration - stride; b > stride / 3; b -= stride) lines.unshift(b);
	else for (let b = stride; b < duration - stride / 3; b += stride) lines.push(b);
	const edges = [0, ...lines, duration];
	const pts = ['0 0%'];
	for (let k = 1; k < edges.length; k++) {
		const [a, b] = [edges[k - 1], edges[k]];
		for (let i = 1; i <= 6; i++) {
			const u = i / 6;
			const eased = SWAY * u * u * (3 - 2 * u) + (1 - SWAY) * u;
			const p = (a + (b - a) * eased) / duration;
			const x = ((a + (b - a) * u) / duration) * 100;
			pts.push(`${p.toFixed(4)} ${x.toFixed(2)}%`);
		}
	}
	return `linear(${pts.join(', ')})`;
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
	#arrived: (hex: string, at: number) => void;
	#stride: () => number;
	/** Blocks a drawn ant is still walking to. */
	readonly bound = new Set<number>();
	/** How many drawn ants of each color are still walking to their blocks. */
	#coming = new Map<string, number>();

	/**
	 * `arrived` is called with its color, and when it was meant to get there,
	 * whenever a drawn ant gets to its block. Ants take a stride every `stride()` ms.
	 */
	constructor(
		layer: HTMLElement,
		arrived: (hex: string, at: number) => void,
		stride: () => number
	) {
		super();
		this.#layer = layer;
		this.#arrived = arrived;
		this.#stride = stride;
	}

	/** One ant: along `path` to block `cell`, getting there at time `at` (ms), then back the same way. */
	run(path: Point[], cell: number, at: number, hex: string, size: number) {
		if (this.size >= MAX_ANTS || path.length < 2 || !canAnimate()) return;
		const origin = path[0];
		const node = document.createElement('div');
		node.className = 'ant';
		node.style.cssText = `--size:${size}px;--crumb:${hex};left:${origin.x}px;top:${origin.y}px`;
		const ant = this.add(this.#layer, node);
		this.bound.add(cell);
		this.#coming.set(hex, this.coming(hex) + 1);

		const duration = Math.max(100, at - performance.now());
		const stride = this.#stride();
		const out = this.animate(ant, frames(path, origin), {
			duration,
			easing: inStep(duration, stride, true),
			fill: 'forwards'
		});
		out.onfinish = () => {
			this.bound.delete(cell);
			this.#coming.set(hex, this.coming(hex) - 1);
			this.#arrived(hex, at);
			const back = this.animate(ant, frames([...path].reverse(), origin), {
				duration,
				easing: inStep(duration, stride, false),
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
