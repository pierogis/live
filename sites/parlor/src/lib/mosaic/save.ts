/* Saved progress. Browser only, and never required: storage can be missing or blocked. */

export interface Save {
	completed: Record<string, boolean>;
	level: number;
	relaxed: boolean;
	muted: boolean;
}

const KEY = 'mosaic:v1';

export function loadSave(): Save {
	const save: Save = { completed: {}, level: 0, relaxed: false, muted: false };
	try {
		const raw = localStorage.getItem(KEY);
		const v = raw && JSON.parse(raw);
		if (v && typeof v === 'object') Object.assign(save, v);
	} catch {
		/* private mode, blocked storage */
	}
	return save;
}

export function persist(save: Save) {
	try {
		localStorage.setItem(KEY, JSON.stringify(save));
	} catch {
		/* private mode, blocked storage */
	}
}
