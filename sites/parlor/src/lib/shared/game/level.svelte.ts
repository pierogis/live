/*
 * A level's life, the same for every game: building it (on the server too, so a
 * level page arrives drawn), moving to another level, undo and restart, noticing
 * a win or a dead end, the end panel, saving, sound and the shared keys.
 *
 * A level in progress lives only in memory, so it's also kept in the tab's
 * session storage when the page is hidden or left, and picked up again when the
 * same level's page loads in the same tab. That way a page the browser reloads
 * (a phone that dropped a backgrounded tab, or the dev server reconnecting)
 * comes back where you were.
 *
 * A game makes one `LevelControl` while its component starts, passing its props
 * and a few hooks (`LevelGame`), and keeps only its own board, UI and animations.
 * Engines change their state in place, so the game calls `touch()` after each
 * change; everything derived from the state reads `version` to redraw.
 */
import { untrack } from 'svelte';
import { goto } from '$app/navigation';

import type { Listed, Picture } from '../level';
import { hashStr } from '../engine';
import { memoryStore, type GameSave, type Save, type SaveStore } from '../save';
import { music, type Clock, type Music, type Rhythm } from '../sound';
import { Cue } from './cue.svelte';

interface CommonProps<S> {
	/** Start on this level instead of the saved one. */
	start?: number;
	/** The `start` level's state as `build` makes it, built ahead of time (say, at prerender). */
	initial?: S;
	/** Keep progress in memory only, never in the cookie: for play-testing a draft. */
	sandbox?: boolean;
	/** Where the list of all pictures lives; omit to hide the link. */
	picturesHref?: string;
}

/** Each level has its own page, which builds it ahead; moving to another level goes there. */
interface PagedProps<L extends Picture, S> extends CommonProps<S> {
	/** Every level in play order, without its picture: enough to name and save each one. */
	levels: Listed<L>[];
	start: number;
	initial: S;
	levelHref: (index: number) => string;
}

/** Every level built and played in place, like the editor's play-test. */
interface InPlaceProps<L extends Picture, S> extends CommonProps<S> {
	levels: L[];
	levelHref?: undefined;
}

/** The props every game component takes; the controller reads them through a getter. */
export type LevelProps<L extends Picture, S> = PagedProps<L, S> | InPlaceProps<L, S>;

/** What a game tells the controller about itself. */
export interface LevelGame<L extends Picture, S> {
	/** The game's save: its cookie store, option defaults and options. */
	save: GameSave;
	/**
	 * Level `index`'s starting state. Pure, with no options applied, so it also
	 * runs on the server and ahead of time (the `initial` prop).
	 */
	build(level: L, index: number): S;
	clone(s: S): S;
	isWon(s: S): boolean;
	/** No way left to win from here. */
	isStuck(s: S): boolean;
	/**
	 * Fit a just-built state to the player's options, in place (Mosaic's relaxed
	 * tray). Also runs once the save loads in the browser, on a state built
	 * without it, so it must give the same result either way.
	 */
	applyOptions?(s: S, options: Record<string, boolean>): void;
	/**
	 * `state` was replaced: a new level, an undo or a restart. Drop the game's
	 * own passing state, like a selection or animations in flight. Runs while the
	 * controller is being made too, so use `state` rather than the controller.
	 */
	reset?(state: S, why: 'level' | 'undo' | 'restart'): void;
	/**
	 * The game's own keys, after typing in a field and modified keys are left
	 * alone. `key` is lower case. Return true when the key was used.
	 */
	key?(e: KeyboardEvent, key: string): boolean | void;
	/** Read out to screen readers on a win, like "Picture complete." */
	wonStatus: string;
	/** How long the finished picture shows before the end panel; 900ms by default. */
	winDelay?: number;
	/** How long to wait before showing that the game is stuck; at once by default. */
	stuckDelay?: number;
	/** Undo steps kept; 500 by default. */
	maxHistory?: number;
	/** How its landings come, for the music: its sixteenth note, and whether the ones between tune notes play. */
	rhythm: Rhythm;
}

export class LevelControl<L extends Picture, S extends { moves: number }> {
	/** Progress as last read or written; a fresh save until the component mounts. */
	save: Save = $state.raw({ level: 0, completed: {}, muted: false, options: {} });
	/** The level being played, from 0. */
	index = $state(0);
	/** Bumps on each new level, so `{#key}` rebuilds the board rather than reusing it. */
	key = $state(0);
	/** The game as it is now. The engine changes it in place; see `touch`. */
	state: S | null = $state.raw(null);
	/** The level as it started, for restart. */
	initial: S | null = $state.raw(null);
	/** Bumps on every change to `state`. */
	version = $state(0);
	/** The end panel: a finished or a stuck level. */
	overlay: 'win' | 'stuck' | null = $state(null);
	/** Finished; the end panel follows after a moment. */
	won = $state(false);
	/** Read out to screen readers only; the game shows what happens instead of narrating it. */
	status = $state('');
	/** The options the current level was built with. */
	options: Record<string, boolean> = $state.raw({});

	level: Listed<L> = $derived.by(() => this.#props().levels[this.index]);
	/** The level's name, like "Bullseye". */
	label = $derived.by(() => this.level?.name ?? '');
	/** You've finished this level, before or just now. */
	done = $derived.by(() => !!this.level && !!this.save.completed[this.level.id]);
	canUndo = $derived.by(() => {
		void this.version;
		return this.#history.length > 0;
	});
	/** The level after this one, wrapping around to the first. */
	nextIndex = $derived.by(() => (this.index + 1) % this.#props().levels.length);

	#game: LevelGame<L, S>;
	#props: () => LevelProps<L, S>;
	#store: SaveStore;
	/** A plain array: every change to it comes with a `version` bump. */
	#history: S[] = [];
	#stuckSeen = false;
	// Never drawn, so it needn't be reactive.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#timers = new Set<ReturnType<typeof setTimeout>>();
	#cues: Cue<unknown>[] = [];
	#motion: MediaQueryList | null = null;
	/** Mounted with the game's own save: the level in progress is kept through a reload. */
	#keeping = false;

	/**
	 * Call while the component starts. `props` gives the component's props object
	 * (`() => props`), which the controller reads as it changes.
	 */
	constructor(game: LevelGame<L, S>, props: () => LevelProps<L, S>) {
		this.#game = game;
		this.#props = props;
		this.save = game.save.blank();
		this.#store = untrack(() =>
			props().sandbox ? memoryStore(game.save.blank()) : game.save.store
		);
		// The page's own level, built right away (on the server too).
		untrack(() => {
			const { start } = props();
			if (start !== undefined) this.#build(this.#clamp(start));
		});
		// Moving between level pages reuses the component with a new `start`.
		$effect(() => {
			const next = props().start;
			untrack(() => {
				if (next !== undefined && this.#clamp(next) !== this.index) this.start(this.#clamp(next));
			});
		});
	}

	/**
	 * Call from `onMount`: reads the save, then either resumes the saved level or,
	 * when the page's level is built already, fits it to the saved options and
	 * remembers it. With the game's own save, it then picks up a game kept through
	 * a reload and keeps the game whenever the page is hidden. Returns the cleanup.
	 */
	mount(): () => void {
		this.#motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		this.save = this.#store.load();
		if (this.#props().start === undefined) {
			this.start(this.#clamp(this.save.level | 0));
		} else {
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
		}
		if (this.#store !== this.#game.save.store) return () => this.destroy();
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
			// Gone to another page in the site: what was kept is stale now.
			this.#keeping = false;
			this.#forget();
			this.destroy();
		};
	}

	destroy() {
		this.#clearTimers();
		for (const cue of this.#cues) cue.stop();
	}

	/** Whether the player asked for less motion. */
	get still(): boolean {
		return !!this.#motion?.matches;
	}

	/** Call after the engine changes `state`, so what reads it redraws. */
	touch() {
		this.version++;
	}

	say(msg: string) {
		this.status = msg;
	}

	/** The level's music, or null while the sound is off: `ctl.music?.note(hex)`. */
	get music(): Music | null {
		return this.save.muted ? null : music;
	}

	/** The level's beat, sound or not: land things on it so the music keeps time. */
	get clock(): Clock {
		return music.clock;
	}

	/** Color `hex` was just finished: its sound, unless that finished the picture (the win has its own). */
	finished(hex: string) {
		if (this.state && !this.#game.isWon(this.state)) this.music?.done(hex);
	}

	/** A cue that's turned off when the game goes away. */
	cue<T>(off: T, ms?: number): Cue<T> {
		const cue = new Cue(off, ms);
		this.#cues.push(cue);
		return cue;
	}

	// ---------- levels ----------
	/** Start level `i` here and remember it. */
	start(i: number) {
		// Another level: the one kept from before is stale.
		if (this.#keeping) this.#forget();
		this.#build(i);
		this.#write((s) => {
			s.level = i;
		});
	}

	/** Another level: its own page when there is one, else in place. */
	go = (i: number) => {
		const href = this.#props().levelHref;
		if (href) goto(href(i));
		else this.start(i);
	};

	next = () => this.go(this.nextIndex);

	get nextHref(): string | undefined {
		return this.#props().levelHref?.(this.nextIndex);
	}

	/** LevelNav's props: `<LevelNav {...ctl.nav} />`. */
	get nav() {
		return {
			index: this.index,
			count: this.#props().levels.length,
			href: this.#props().levelHref,
			ongo: this.go
		};
	}

	/**
	 * Set up level i. No saving and no page access, so it also runs on the server.
	 * The `start` level comes from the `initial` prop when there is one.
	 */
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

	/** Level i's starting state: the page's own, built ahead, or built here. */
	#starting(i: number): S {
		const props = this.#props();
		if (props.initial && i === props.start) return this.#game.clone(props.initial);
		// A level with its own page is only played there, where it's built ahead.
		if (props.levelHref) throw new Error(`level ${i + 1} is built on its own page`);
		return this.#game.build(props.levels[i], i);
	}

	#clamp(i: number) {
		return Math.min(Math.max(0, i), this.#props().levels.length - 1);
	}

	// ---------- moves ----------
	/** Call with a copy of the state from before a move that went through, so it can be undone. */
	record(before: S) {
		this.#history.push(before);
		if (this.#history.length > (this.#game.maxHistory ?? 500)) this.#history.shift();
		this.#stuckSeen = false;
		// Quick moves swell the music.
		this.music?.move();
	}

	/** Call when the board is still: wins, or shows the stuck panel when no way is left. */
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
		this.#write((s) => {
			s.completed[id] = true;
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

	/** Back to the level's start; undo brings the game back. `fromEnd` is the end panel's button. */
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

	/** For `<svelte:document onkeydown>`: Z undoes, R restarts, then the game's own keys. */
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

	// ---------- the shared pieces ----------
	/** GameBar's props: `<GameBar {...ctl.bar} game=… />`. */
	get bar() {
		return {
			label: this.label,
			done: this.done,
			canUndo: this.canUndo,
			muted: this.save.muted,
			onundo: this.undo,
			onrestart: () => this.restart(),
			onsound: this.toggleSound,
			picturesHref: this.#props().picturesHref
		};
	}

	/** LevelEnd's props, while `overlay` is set: `<LevelEnd {...ctl.end} text=… />`. */
	get end() {
		return {
			state: this.overlay === 'win' ? ('won' as const) : ('stuck' as const),
			nextHref: this.nextHref,
			onnext: this.next,
			onundo: this.undo,
			onrestart: () => this.restart(true),
			picturesHref: this.#props().picturesHref
		};
	}

	// ---------- a level in progress, through a reload ----------
	get #sessionKey() {
		return `${this.#game.save.cookie}-playing`;
	}

	/** What the level started as, so a kept game is only picked up on the same deal. */
	#deal(): number {
		return hashStr(JSON.stringify(this.initial));
	}

	/**
	 * Keep the level in progress in session storage. Runs when the page is hidden or
	 * left, which comes before any reload, so what's kept is always the latest.
	 */
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
				// Too big for the storage: keep the game without its undo steps.
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

	/** Pick up the level as it was kept, once: only on the page load right after. */
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

	// ---------- saving and timers ----------
	/** Change the save through the store, which keeps progress made in another tab. */
	#write(fn: (s: Save) => void) {
		this.save = this.#store.update(fn);
	}

	/** Run `fn` after `ms` (now, for 0), unless the level changes first. */
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
