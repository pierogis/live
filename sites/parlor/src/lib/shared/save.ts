/*
 * Saved progress for any game, in one small cookie per game, so the server can
 * read it too: it resumes your level and draws your ✓ marks before the page
 * arrives. The browser reads and writes it; nothing about it is secret.
 *
 *   parlor-<game> = l=<level hash>&d=<finished level hashes>&m=<muted>&o=<options>
 *
 * Levels are kept by id, never by position, so adding, removing or moving a
 * level leaves every ✓ mark and your saved level on the same picture. Each id
 * goes in as a 4-character hash (24 bits, base64url): `l` is the current
 * level's hash and `d` is the finished levels' hashes run together, so 200
 * finished levels take about 800 characters. Reading a cookie matches the
 * hashes against the game's current ids and skips any that match none.
 * test/save.test.ts checks that no two of a game's ids share a hash.
 *
 * Options are a game's own on/off settings, like Mosaic's relaxed mode. Each game
 * declares them with their defaults (`GameOption`), and `o` lists every option the
 * save has, by key, separated by dots, an off one with a leading `-`:
 * `o=relaxed` or `o=-relaxed`. An option missing from `o` reads as its default.
 *
 * Each game makes its own save functions with `gameSave`. A game's level
 * controller reads and writes through a `SaveStore`: the cookie, or a store in
 * memory for play that shouldn't touch it (the editor's play-test).
 */
import { hashStr } from './engine.ts';

export interface Save {
	/** The level you're on, from 0: its place in the game's current play order. */
	level: number;
	/** Finished levels, by id. */
	completed: Record<string, boolean>;
	muted: boolean;
	/** The game's own settings by key, like Mosaic's `relaxed`. See `GameOption`. */
	options: Record<string, boolean>;
}

/** One of a game's on/off settings, shown as a toggle on its pictures page. */
export interface GameOption {
	/** Its key in `Save.options` and the cookie: letters and digits only. */
	key: string;
	label: string;
	/** A line under the label saying what it does. */
	note?: string;
	/** What a new save starts with; off unless given. */
	default?: boolean;
}

/** Where a game's progress lives. Both calls are for the browser only. */
export interface SaveStore {
	/** The save as it is now. */
	load(): Save;
	/**
	 * Change the save without losing progress made elsewhere: `fn` gets a copy of
	 * the save as it is now to change (mutate it or return a new one). Finished
	 * levels are always the union of the old and new ones. Returns what was kept.
	 */
	update(fn: (current: Save) => Save | void): Save;
}

const YEAR = 60 * 60 * 24 * 365;

export const cookieName = (game: string) => `parlor-${game}`;

/** A fresh start; `defaults` are the game's option defaults (see `optionDefaults`). */
export function blank(defaults: Record<string, boolean> = {}): Save {
	return { level: 0, completed: {}, muted: false, options: { ...defaults } };
}

/** Each option's starting value, by key. */
export function optionDefaults(options: GameOption[]): Record<string, boolean> {
	return Object.fromEntries(options.map((o) => [o.key, !!o.default]));
}

const OPTION_KEY = /^[A-Za-z0-9]+$/;

/** A copy of `save` that can be changed without touching it. */
function copy(save: Save): Save {
	return { ...save, completed: { ...save.completed }, options: { ...save.options } };
}

/** `fn`'s change to `current`, keeping every level finished in either. */
function merge(current: Save, fn: (current: Save) => Save | void): Save {
	const draft = copy(current);
	const next = fn(draft) ?? draft;
	const completed: Record<string, boolean> = {};
	for (const done of [current.completed, next.completed]) {
		for (const id in done) if (done[id]) completed[id] = true;
	}
	return { ...next, completed, options: { ...next.options } };
}

/** A save kept in memory only, starting from `start`: for play that mustn't touch the cookie. */
export function memoryStore(start: Save = blank()): SaveStore {
	let saved = copy(start);
	return {
		load: () => copy(saved),
		update: (fn) => {
			saved = merge(saved, fn);
			return copy(saved);
		}
	};
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** A level id as 4 base64url characters: its 32-bit hash folded to 24 bits. */
export function idHash(id: string): string {
	const h = hashStr(id);
	const n = (h >>> 24) ^ (h & 0xffffff);
	let s = '';
	for (let shift = 18; shift >= 0; shift -= 6) s += ALPHABET[(n >> shift) & 63];
	return s;
}

/** Each hash's level index, for reading a cookie. On a clash the first id wins. */
function indexByHash(ids: string[]): Map<string, number> {
	const map = new Map<string, number>();
	ids.forEach((id, i) => {
		const h = idHash(id);
		if (!map.has(h)) map.set(h, i);
	});
	return map;
}

/** A save as a cookie value; `ids` are the game's level ids in play order. */
export function encode(save: Save, ids: string[]): string {
	const current = ids[save.level];
	const q = new URLSearchParams({
		l: current === undefined ? '' : idHash(current),
		d: ids
			.filter((id) => save.completed[id])
			.map(idHash)
			.join(''),
		m: save.muted ? '1' : '0'
	});
	const options = Object.entries(save.options)
		.filter(([key]) => OPTION_KEY.test(key))
		.map(([key, on]) => (on ? key : `-${key}`));
	if (options.length) q.set('o', options.join('.'));
	return q.toString();
}

/**
 * A cookie value back to a save; anything missing or broken reads as a fresh
 * start. `defaults` fill in options the cookie doesn't mention.
 */
export function decode(
	value: string | undefined | null,
	ids: string[],
	defaults: Record<string, boolean> = {}
): Save {
	const save = blank(defaults);
	if (!value) return save;
	try {
		const q = new URLSearchParams(value);
		const byHash = indexByHash(ids);
		save.level = byHash.get(q.get('l') ?? '') ?? 0;
		const d = q.get('d') ?? '';
		for (let i = 0; i + 4 <= d.length; i += 4) {
			const at = byHash.get(d.slice(i, i + 4));
			if (at !== undefined) save.completed[ids[at]] = true;
		}
		save.muted = q.get('m') === '1';
		for (const part of (q.get('o') ?? '').split('.')) {
			const off = part.startsWith('-');
			const key = off ? part.slice(1) : part;
			if (OPTION_KEY.test(key)) save.options[key] = !off;
		}
	} catch {
		return blank(defaults); // a broken cookie is a fresh start
	}
	return save;
}

/** In the browser: the game's save, from its cookie. A badly encoded cookie is a fresh start. */
function readSave(game: string, ids: string[], defaults: Record<string, boolean>): Save {
	const name = cookieName(game);
	const raw = document.cookie
		.split('; ')
		.find((c) => c.startsWith(`${name}=`))
		?.slice(name.length + 1);
	if (!raw) return blank(defaults);
	let value: string;
	try {
		value = decodeURIComponent(raw);
	} catch {
		return blank(defaults);
	}
	return decode(value, ids, defaults);
}

function writeSave(game: string, ids: string[], save: Save) {
	const value = encodeURIComponent(encode(save, ids));
	document.cookie = `${cookieName(game)}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}

/** A game's save functions, from `gameSave`. */
export interface GameSave {
	/** The game's options, for its pictures page. */
	options: GameOption[];
	/** A fresh save with the game's option defaults. */
	blank(): Save;
	/** In the browser: the save in the cookie right now. */
	loadSave(): Save;
	/**
	 * In the browser: overwrite the cookie with `save`, whole. Anything another
	 * tab saved since `save` was read is lost, so prefer `update`; this is for
	 * a deliberate reset.
	 */
	persist(save: Save): void;
	/**
	 * In the browser: change the save without losing progress made elsewhere.
	 * Reads the cookie as it is now, hands a copy to `fn` to change (mutate it
	 * or return a new one), and writes the result. Finished levels are always
	 * the union of the cookie's and `fn`'s, so a level finished in another tab
	 * stays finished; `level`, `muted` and `options` are whatever `fn` leaves.
	 * Returns what it wrote, to keep in memory:
	 *
	 *   save = update((s) => { s.completed[lv.id] = true; s.level = i; });
	 */
	update(fn: (current: Save) => Save | void): Save;
	/** The cookie as a `SaveStore`: `loadSave` and `update`. */
	store: SaveStore;
	/** The cookie's name, for a server to read it: `saveFromCookie(cookies.get(cookie))`. */
	cookie: string;
	/** On the server: the save from the request's cookie. */
	saveFromCookie(value: string | undefined): Save;
}

/**
 * A game's save functions; `levels` gives its levels in play order, and
 * `options` its own settings.
 */
export function gameSave(
	game: string,
	levels: () => { id: string }[],
	options: GameOption[] = []
): GameSave {
	for (const o of options) {
		if (!OPTION_KEY.test(o.key)) throw new Error(`${game}: bad option key "${o.key}"`);
	}
	const defaults = optionDefaults(options);
	const ids = () => levels().map((l) => l.id);
	const loadSave = () => readSave(game, ids(), defaults);
	const update = (fn: (current: Save) => Save | void): Save => {
		const all = ids();
		const merged = merge(readSave(game, all, defaults), fn);
		writeSave(game, all, merged);
		return merged;
	};
	return {
		options,
		blank: () => blank(defaults),
		loadSave,
		persist: (save) => writeSave(game, ids(), save),
		update,
		store: { load: loadSave, update },
		cookie: cookieName(game),
		saveFromCookie: (value) => decode(value, ids(), defaults)
	};
}
