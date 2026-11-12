import { untrack } from 'svelte';
import { goto } from '$app/navigation';

import type { Listed, Picture } from '../level';
import { hashStr } from '../engine';
import type { GameSave, Save } from '../save';
import { music, type Clock, type Music, type Rhythm } from '../sound';
import { Cue } from './cue.svelte';

export interface LevelProps<L extends Picture, S> {
	levels: Listed<L>[];
	start: number;
	initial: S;
	levelHref: (index: number) => string;
	muralsHref?: string;
}

export interface LevelGame<S> {
	save: GameSave;
	clone(s: S): S;
	isWon(s: S): boolean;
	isStuck(s: S): boolean;
	/** Also runs on a state built without the saved options, so must give the same result. */
	applyOptions?(s: S, options: Record<string, boolean>): void;
	reset?(state: S, why: 'level' | 'undo' | 'restart'): void;
	key?(e: KeyboardEvent, key: string): boolean | void;
	wonStatus: string;
	winDelay?: number;
	stuckDelay?: number;
	maxHistory?: number;
	rhythm: Rhythm;
}

export class LevelControl<L extends Picture, S extends { moves: number }> {
	save: Save = $state.raw({ level: 0, completed: {}, muted: false, options: {} });
	index = $state(0);
	key = $state(0);
	state: S | null = $state.raw(null);
	initial: S | null = $state.raw(null);
	version = $state(0);
	overlay: 'win' | 'stuck' | null = $state(null);
	won = $state(false);
	status = $state('');
	options: Record<string, boolean> = $state.raw({});

	level: Listed<L> = $derived.by(() => this.#props().levels[this.index]);
	label = $derived.by(() => this.level?.name ?? '');
	done = $derived.by(() => !!this.level && !!this.save.completed[this.level.id]);
	canUndo = $derived.by(() => {
		void this.version;
		return this.#history.length > 0;
	});
	nextIndex = $derived.by(() => (this.index + 1) % this.#props().levels.length);
	#panels = $derived.by(() => {
		const panel = this.level?.panel;
		if (!panel) return [];
		const first = this.index - (panel.n - 1);
		return this.#props().levels.slice(first, first + panel.of);
	});
	muralDone = $derived.by(
		() => this.#panels.length > 0 && this.#panels.every((l) => this.save.completed[l.id])
	);

	wonText(done: string): string {
		const { name, panel } = this.level;
		if (!panel) return `${name} ${done}.`;
		if (this.muralDone) return `${name} ${done}. ${panel.mural} is finished.`;
		return `${name} ${done}: panel ${panel.n} of ${panel.of} of ${panel.mural}.`;
	}

	#game: LevelGame<S>;
	#props: () => LevelProps<L, S>;
	#history: S[] = [];
	#stuckSeen = false;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#timers = new Set<ReturnType<typeof setTimeout>>();
	#cues: Cue<unknown>[] = [];
	#motion: MediaQueryList | null = null;
	#keeping = false;

	constructor(game: LevelGame<S>, props: () => LevelProps<L, S>) {
		this.#game = game;
		this.#props = props;
		this.save = game.save.blank();
		untrack(() => this.#build(this.#clamp(props().start)));
		$effect(() => {
			const next = props().start;
			untrack(() => {
				if (this.#clamp(next) !== this.index) this.start(this.#clamp(next));
			});
		});
	}

	mount(): () => void {
		this.#motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		this.save = this.#game.save.store.load();
		const { state, initial } = this;
		const apply = this.#game.applyOptions;
		if (apply && state && initial) {
			apply(state, this.save.options);
			apply(initial, this.save.options);
			this.options = this.save.options;
			this.touch();
		}
		const index = this.index;
		this.#write((s) => {
			s.level = index;
		});
		this.#resume();
		this.#keeping = true;
		const keep = () => this.#keep();
		const onHide = () => {
			if (document.visibilityState === 'hidden') keep();
		};
		document.addEventListener('visibilitychange', onHide);
		window.addEventListener('pagehide', keep);
		return () => {
			document.removeEventListener('visibilitychange', onHide);
			window.removeEventListener('pagehide', keep);
			this.#keeping = false;
			this.#forget();
			this.destroy();
		};
	}

	destroy() {
		this.#clearTimers();
		for (const cue of this.#cues) cue.stop();
	}

	get still(): boolean {
		return !!this.#motion?.matches;
	}

	touch() {
		this.version++;
	}

	say(msg: string) {
		this.status = msg;
	}

	get music(): Music | null {
		return this.save.muted ? null : music;
	}

	get clock(): Clock {
		return music.clock;
	}

	finished(hex: string) {
		if (this.state && !this.#game.isWon(this.state)) this.music?.done(hex);
	}

	cue<T>(off: T, ms?: number): Cue<T> {
		const cue = new Cue(off, ms);
		this.#cues.push(cue);
		return cue;
	}

	start(i: number) {
		if (this.#keeping) this.#forget();
		this.#build(i);
		this.#write((s) => {
			s.level = i;
		});
	}

	go = (i: number) => goto(this.#props().levelHref(i));

	next = () => this.go(this.nextIndex);

	get nextHref(): string {
		return this.#props().levelHref(this.nextIndex);
	}

	get nav() {
		return {
			index: this.index,
			count: this.#props().levels.length,
			href: this.#props().levelHref,
			ongo: this.go
		};
	}

	#build(i: number) {
		const g = this.#game;
		const s = this.#starting(i);
		const options = this.save.options;
		g.applyOptions?.(s, options);
		this.#clearTimers();
		this.overlay = null;
		this.won = false;
		this.#stuckSeen = false;
		this.index = i;
		this.state = s;
		this.initial = g.clone(s);
		this.options = options;
		this.#history = [];
		this.key++;
		music.seed(hashStr(this.level.id), this.#game.rhythm, this.level.song);
		g.reset?.(s, 'level');
		this.touch();
		this.say(`${this.level.name}.`);
	}

	#starting(i: number): S {
		const props = this.#props();
		if (i !== props.start) throw new Error(`level ${i + 1} is built on its own page`);
		return this.#game.clone(props.initial);
	}

	#clamp(i: number) {
		return Math.min(Math.max(0, i), this.#props().levels.length - 1);
	}

	record(before: S) {
		this.#history.push(before);
		if (this.#history.length > (this.#game.maxHistory ?? 500)) this.#history.shift();
		this.#stuckSeen = false;
		if (this.#game.rhythm.paced) this.clock.paced(performance.now());
		this.music?.move();
	}

	settle() {
		const s = this.state;
		const g = this.#game;
		if (!s || this.won || this.overlay) return;
		if (g.isWon(s)) {
			this.#win();
			return;
		}
		if (this.#stuckSeen || !g.isStuck(s)) return;
		this.#stuckSeen = true;
		this.#later(g.stuckDelay ?? 0, () => {
			if (this.state === s && !this.overlay && g.isStuck(s)) this.overlay = 'stuck';
		});
	}

	#win() {
		const g = this.#game;
		const id = this.level.id;
		const panels = this.#panels;
		const next = this.nextIndex;
		this.#write((s) => {
			s.completed[id] = true;
			if (panels.length && panels.every((l) => s.completed[l.id])) s.level = next;
		});
		this.won = true;
		this.music?.cadence();
		this.say(g.wonStatus);
		this.#later(g.winDelay ?? 900, () => {
			if (this.state && g.isWon(this.state)) this.overlay = 'win';
		});
	}

	undo = () => {
		if (!this.#history.length || (this.overlay && this.overlay !== 'stuck')) return;
		this.#clearTimers();
		this.overlay = null;
		const s = this.#history.pop()!;
		this.state = s;
		this.won = false;
		this.#stuckSeen = false;
		this.#game.reset?.(s, 'undo');
		this.touch();
		this.say('Undone.');
	};

	restart = (fromEnd = false) => {
		const { state, initial } = this;
		if (!state || !initial || (this.overlay && !fromEnd)) return;
		this.#clearTimers();
		this.overlay = null;
		if (state.moves > 0) this.record(state);
		const s = this.#game.clone(initial);
		this.state = s;
		this.won = false;
		this.#stuckSeen = false;
		this.#game.reset?.(s, 'restart');
		this.touch();
		this.say('Started over.');
	};

	toggleSound = () => {
		const muted = !this.save.muted;
		this.#write((s) => {
			s.muted = muted;
		});
		if (muted) music.hush();
		else music.chime();
	};

	onKey = (e: KeyboardEvent) => {
		if ((e.target as Element).closest?.('input, textarea, select')) return;
		const key = e.key.toLowerCase();
		if (e.metaKey || e.ctrlKey || e.altKey) {
			if (key === 'z' && !e.altKey) {
				e.preventDefault();
				this.undo();
			}
			return;
		}
		if (this.#game.key?.(e, key)) return;
		if (key === 'z') this.undo();
		else if (key === 'r') this.restart();
	};

	get bar() {
		return {
			label: this.label,
			done: this.done,
			canUndo: this.canUndo,
			muted: this.save.muted,
			onundo: this.undo,
			onrestart: () => this.restart(),
			onsound: this.toggleSound,
			muralsHref: this.#murals
		};
	}

	get #murals(): string | undefined {
		const href = this.#props().muralsHref;
		return href && this.level ? `${href}#${this.level.id}` : href;
	}

	get end() {
		return {
			state: this.overlay === 'win' ? ('won' as const) : ('stuck' as const),
			nextHref: this.nextHref,
			onnext: this.next,
			finished: this.muralDone,
			onundo: this.undo,
			onrestart: () => this.restart(true),
			muralsHref: this.#murals
		};
	}

	get #sessionKey() {
		return `${this.#game.save.cookie}-playing`;
	}

	#deal(): number {
		return hashStr(JSON.stringify(this.initial));
	}

	#keep() {
		const { state, level } = this;
		if (!state || !level || this.won || state.moves === 0) {
			this.#forget();
			return;
		}
		try {
			const kept = { id: level.id, deal: this.#deal(), state, history: this.#history };
			try {
				sessionStorage.setItem(this.#sessionKey, JSON.stringify(kept));
			} catch {
				sessionStorage.setItem(this.#sessionKey, JSON.stringify({ ...kept, history: [] }));
			}
		} catch {
			/* no session storage: a reload starts the level over */
		}
	}

	#forget() {
		try {
			sessionStorage.removeItem(this.#sessionKey);
		} catch {
			/* nothing kept */
		}
	}

	#resume() {
		let kept: { id: string; deal: number; state: S; history: S[] } | null = null;
		try {
			kept = JSON.parse(sessionStorage.getItem(this.#sessionKey) ?? 'null');
		} catch {
			/* broken or out of reach: start fresh */
		}
		this.#forget();
		if (!kept || !this.level || kept.id !== this.level.id || kept.deal !== this.#deal()) return;
		this.#clearTimers();
		this.overlay = null;
		this.won = false;
		this.#stuckSeen = false;
		this.state = kept.state;
		this.#history = kept.history;
		this.#game.reset?.(kept.state, 'undo');
		this.touch();
		this.settle();
	}

	#write(fn: (s: Save) => void) {
		this.save = this.#game.save.store.update(fn);
	}

	#later(ms: number, fn: () => void) {
		if (ms <= 0) {
			fn();
			return;
		}
		const t = setTimeout(() => {
			this.#timers.delete(t);
			fn();
		}, ms);
		this.#timers.add(t);
	}

	#clearTimers() {
		this.#timers.forEach(clearTimeout);
		this.#timers.clear();
	}
}
