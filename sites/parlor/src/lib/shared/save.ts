/*
 * Saved progress for any game, in one small cookie per game, so the server can
 * read it too: it resumes your level and draws your ✓ marks before the page
 * arrives. The browser reads and writes it; nothing about it is secret.
 *
 *   parlor-<game> = l=<level>&d=<finished levels>&m=<muted>&r=<relaxed>
 *
 * Finished levels are a bit per level in play order, base64url, so 100 levels
 * take 17 characters. Reordering levels moves the marks with the positions.
 * An older save in browser storage moves into the cookie the first time.
 */

export interface Save {
	/** The level you're on, from 0. */
	level: number;
	/** Finished levels, by id. */
	completed: Record<string, boolean>;
	muted: boolean;
	/** Mosaic's bigger tray. */
	relaxed: boolean;
}

const YEAR = 60 * 60 * 24 * 365;

export const cookieName = (game: string) => `parlor-${game}`;

export function blank(): Save {
	return { level: 0, completed: {}, muted: false, relaxed: false };
}

function toBase64Url(bytes: Uint8Array): string {
	let s = '';
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
	const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(s, (ch) => ch.charCodeAt(0));
}

/** A save as a cookie value; `ids` are the game's level ids in play order. */
export function encode(save: Save, ids: string[]): string {
	const bits = new Uint8Array(Math.ceil(ids.length / 8));
	ids.forEach((id, i) => {
		if (save.completed[id]) bits[i >> 3] |= 1 << (i & 7);
	});
	const q = new URLSearchParams({
		l: String(save.level),
		d: toBase64Url(bits),
		m: save.muted ? '1' : '0',
		r: save.relaxed ? '1' : '0'
	});
	return q.toString();
}

/** A cookie value back to a save; anything missing or broken reads as a fresh start. */
export function decode(value: string | undefined | null, ids: string[]): Save {
	const save = blank();
	if (!value) return save;
	try {
		const q = new URLSearchParams(value);
		const level = Number(q.get('l'));
		if (Number.isInteger(level) && level >= 0 && level < ids.length) save.level = level;
		const bits = fromBase64Url(q.get('d') ?? '');
		ids.forEach((id, i) => {
			if (bits[i >> 3] & (1 << (i & 7))) save.completed[id] = true;
		});
		save.muted = q.get('m') === '1';
		save.relaxed = q.get('r') === '1';
	} catch {
		/* a broken cookie is a fresh start */
	}
	return save;
}

/** In the browser: the game's save, from its cookie or an older save in browser storage. */
export function readSave(game: string, ids: string[], oldKey?: string): Save {
	const name = cookieName(game);
	const raw = document.cookie
		.split('; ')
		.find((c) => c.startsWith(`${name}=`))
		?.slice(name.length + 1);
	if (raw) return decode(decodeURIComponent(raw), ids);
	if (oldKey) {
		try {
			const old = JSON.parse(localStorage.getItem(oldKey) ?? 'null');
			if (old && typeof old === 'object') {
				const save = { ...blank(), ...old };
				writeSave(game, ids, save);
				localStorage.removeItem(oldKey);
				return save;
			}
		} catch {
			/* blocked storage */
		}
	}
	return blank();
}

export function writeSave(game: string, ids: string[], save: Save) {
	const value = encodeURIComponent(encode(save, ids));
	document.cookie = `${cookieName(game)}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}
