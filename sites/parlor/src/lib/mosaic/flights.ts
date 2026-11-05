/*
 * Dots flying between the board and the tray. These are short-lived nodes in an
 * overlay layer that Svelte doesn't render, so they're plain DOM.
 */

const FLIGHT = 420;

/** Where each dot is on screen right now, by dot id. */
export function snapshotRects(roots: (HTMLElement | undefined)[]): Map<number, DOMRect> {
	const map = new Map<number, DOMRect>();
	for (const root of roots) {
		root?.querySelectorAll<HTMLElement>('.gem[data-id]').forEach((n) => {
			map.set(+n.dataset.id!, n.getBoundingClientRect());
		});
	}
	return map;
}

export class Flights {
	#live = new Set<{ anim: Animation; node: HTMLElement }>();

	get size() {
		return this.#live.size;
	}

	/**
	 * Fly a dot of color `hex` from `from` to `target`, then call `onLand`.
	 * Lands right away when there's nothing to animate or motion is reduced.
	 * `onSettle` runs once the last flight in the air has landed.
	 */
	launch(opts: {
		layer: HTMLElement | undefined;
		hex: string;
		from: DOMRect | undefined;
		target: HTMLElement | null;
		delay: number;
		still: boolean;
		onLand: () => void;
		onSettle: () => void;
	}) {
		const { layer, hex, from, target, delay, onLand, onSettle } = opts;
		if (!layer || !from || !target || opts.still || !Element.prototype.animate) {
			onLand();
			return;
		}
		const to = target.getBoundingClientRect();
		const node = document.createElement('div');
		node.className = 'gem flyer';
		node.style.cssText = `--c:${hex};left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
		layer.append(node);

		const dx = to.left + to.width / 2 - (from.left + from.width / 2);
		const dy = to.top + to.height / 2 - (from.top + from.height / 2);
		// A plain, straight move: the dot slides over and settles to its new size.
		const scale = (to.width * 0.8) / from.width;
		const anim = node.animate(
			[
				{ transform: 'translate(0,0) scale(1)' },
				{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }
			],
			{ duration: FLIGHT, delay, easing: 'ease-in-out', fill: 'both' }
		);
		const flight = { anim, node };
		this.#live.add(flight);
		anim.onfinish = () => {
			node.remove();
			this.#live.delete(flight);
			onLand();
			if (!this.#live.size) onSettle();
		};
	}

	/** Drop every flight in the air without landing it. */
	cancel() {
		this.#live.forEach((f) => {
			f.anim.onfinish = null;
			f.anim.cancel();
			f.node.remove();
		});
		this.#live.clear();
	}
}
