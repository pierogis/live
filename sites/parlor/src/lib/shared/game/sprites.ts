/*
 * The base for a game's animated sprites: short-lived nodes in an overlay layer
 * that Svelte doesn't render (Mosaic's flying dots, Forage's ants), so they're
 * plain DOM moved with the Web Animations API. It keeps the live ones, so they
 * can all be dropped at once when the board changes under them.
 */

export interface Sprite {
	node: HTMLElement;
	anims: Animation[];
}

/** Whether this browser can animate sprites at all. */
export const canAnimate = () => typeof Element !== 'undefined' && !!Element.prototype.animate;

export class Sprites {
	#live = new Set<Sprite>();

	/** How many are moving now. */
	get size() {
		return this.#live.size;
	}

	/** Put `node` in `layer` and keep it as a live sprite. */
	protected add(layer: HTMLElement, node: HTMLElement): Sprite {
		layer.append(node);
		const sprite = { node, anims: [] };
		this.#live.add(sprite);
		return sprite;
	}

	/** Start an animation on a sprite; dropping the sprite cancels it. */
	protected animate(
		sprite: Sprite,
		keyframes: Keyframe[],
		options: KeyframeAnimationOptions
	): Animation {
		const anim = sprite.node.animate(keyframes, options);
		sprite.anims.push(anim);
		return anim;
	}

	/** Stop a sprite's animations, without their `onfinish`, and remove it. */
	protected drop(sprite: Sprite) {
		for (const anim of sprite.anims) {
			anim.onfinish = null;
			anim.cancel();
		}
		sprite.node.remove();
		this.#live.delete(sprite);
	}

	/** Drop every sprite now, without finishing it. */
	clear() {
		for (const sprite of [...this.#live]) this.drop(sprite);
	}
}
