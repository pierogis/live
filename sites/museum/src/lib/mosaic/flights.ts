import { canAnimate, Sprites } from '../shared/game/sprites';

export const FLIGHT = 420;

export function snapshotRects(roots: (HTMLElement | undefined)[]): Map<number, DOMRect> {
	const map = new Map<number, DOMRect>();
	for (const root of roots) {
		root?.querySelectorAll<HTMLElement>('.gem[data-id]').forEach((n) => {
			map.set(+n.dataset.id!, n.getBoundingClientRect());
		});
	}
	return map;
}

export class Flights extends Sprites {
	launch(opts: {
		layer: HTMLElement | undefined;
		hex: string;
		from: DOMRect | undefined;
		target: HTMLElement | null;
		delay: number;
		duration: number;
		still: boolean;
		onLand: (at: number) => void;
		onSettle: () => void;
	}) {
		const { layer, hex, from, target, delay, duration, still, onLand, onSettle } = opts;
		if (!layer || !from || !target || still || !canAnimate()) {
			onLand(performance.now());
			return;
		}
		const lands = performance.now() + delay + duration;
		const to = target.getBoundingClientRect();
		const node = document.createElement('div');
		node.className = 'gem flyer';
		node.style.cssText = `--c:${hex};left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
		const flight = this.add(layer, node);

		const dx = to.left + to.width / 2 - (from.left + from.width / 2);
		const dy = to.top + to.height / 2 - (from.top + from.height / 2);
		const scale = (to.width * 0.8) / from.width;
		const anim = this.animate(
			flight,
			[
				{ transform: 'translate(0,0) scale(1)' },
				{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }
			],
			{ duration, delay, easing: 'ease-in-out', fill: 'both' }
		);
		anim.onfinish = () => {
			this.drop(flight);
			onLand(lands);
			if (!this.size) onSettle();
		};
	}
}
