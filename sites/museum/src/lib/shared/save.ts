import { hashStr } from './engine.ts';

// museum-<game> = l=<level hash>&d=<finished level hashes>&m=<muted>&o=<options>
export interface Save {
	level: number;
	completed: Record<string, boolean>;
	muted: boolean;
	options: Record<string, boolean>;
}

export interface GameOption {
	key: string;
	label: string;
	note?: string;
	default?: boolean;
}

export interface SaveStore {
	load(): Save;
	update(fn: (current: Save) => Save | void): Save;
}

const YEAR = 60 * 60 * 24 * 365;

export const cookieName = (game: string) => `museum-${game}`;

export function blank(defaults: Record<string, boolean> = {}): Save {
	return { level: 0, completed: {}, muted: false, options: { ...defaults } };
}

function optionDefaults(options: GameOption[]): Record<string, boolean> {
	return Object.fromEntries(options.map((o) => [o.key, !!o.default]));
}

const OPTION_KEY = /^[A-Za-z0-9]+$/;

function copy(save: Save): Save {
	return { ...save, completed: { ...save.completed }, options: { ...save.options } };
}

function merge(current: Save, fn: (current: Save) => Save | void): Save {
	const draft = copy(current);
	const next = fn(draft) ?? draft;
	const completed: Record<string, boolean> = {};
	for (const done of [current.completed, next.completed]) {
		for (const id in done) if (done[id]) completed[id] = true;
	}
	return { ...next, completed, options: { ...next.options } };
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function idHash(id: string): string {
	const h = hashStr(id);
	const n = (h >>> 24) ^ (h & 0xffffff);
	let s = '';
	for (let shift = 18; shift >= 0; shift -= 6) s += ALPHABET[(n >> shift) & 63];
	return s;
}

function indexByHash(ids: string[]): Map<string, number> {
	const map = new Map<string, number>();
	ids.forEach((id, i) => {
		const h = idHash(id);
		if (!map.has(h)) map.set(h, i);
	});
	return map;
}

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
		return blank(defaults);
	}
	return save;
}

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

export interface GameSave {
	options: GameOption[];
	blank(): Save;
	loadSave(): Save;
	persist(save: Save): void;
	update(fn: (current: Save) => Save | void): Save;
	store: SaveStore;
	cookie: string;
	saveFromCookie(value: string | undefined): Save;
}

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
