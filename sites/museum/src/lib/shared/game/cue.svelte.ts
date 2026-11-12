/*
 * A cue marks something for a moment, like the outline on a full tray or a
 * locked column: on now, off again after `ms`. A still mark, never a motion.
 */

export class Cue<T> {
	/** What's marked now; `off` when nothing is. */
	value = $state<T>(undefined as T);
	#off: T;
	#ms: number;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(off: T, ms = 900) {
		this.#off = off;
		this.#ms = ms;
		this.value = off;
	}

	/** Mark `on` for a moment. Showing again before it's over starts the moment over. */
	show(on: T) {
		clearTimeout(this.#timer);
		this.value = on;
		this.#timer = setTimeout(() => (this.value = this.#off), this.#ms);
	}

	/** Unmark now. */
	stop() {
		clearTimeout(this.#timer);
		this.value = this.#off;
	}
}
