export interface Sprite {
	node: HTMLElement;
	anims: Animation[];
}

export const canAnimate = () => typeof Element !== 'undefined' && !!Element.prototype.animate;

export class Sprites {
	#live = new Set<Sprite>();

	get size() {
		return this.#live.size;
	}

	protected add(layer: HTMLElement, node: HTMLElement): Sprite {
		layer.append(node);
		const sprite = { node, anims: [] };
		this.#live.add(sprite);
		return sprite;
	}

	protected animate(
		sprite: Sprite,
		keyframes: Keyframe[],
		options: KeyframeAnimationOptions
	): Animation {
		const anim = sprite.node.animate(keyframes, options);
		sprite.anims.push(anim);
		return anim;
	}

	protected drop(sprite: Sprite) {
		for (const anim of sprite.anims) {
			anim.onfinish = null;
			anim.cancel();
		}
		sprite.node.remove();
		this.#live.delete(sprite);
	}

	clear() {
		for (const sprite of [...this.#live]) this.drop(sprite);
	}
}
