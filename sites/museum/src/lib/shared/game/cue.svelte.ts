export class Cue<T> {
	value = $state<T>(undefined as T);
	#off: T;
	#ms: number;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(off: T, ms = 900) {
		this.#off = off;
		this.#ms = ms;
		this.value = off;
	}

	show(on: T) {
		clearTimeout(this.#timer);
		this.value = on;
		this.#timer = setTimeout(() => (this.value = this.#off), this.#ms);
	}

	stop() {
		clearTimeout(this.#timer);
		this.value = this.#off;
	}
}
