/* Forage's saved progress: one small cookie, so the server can resume your level too. */
import { decode, readSave, writeSave, type Save } from '../shared/save';
import { LEVELS } from './levels/index';

export type { Save };
export { cookieName } from '../shared/save';

const GAME = 'forage';
const ids = () => LEVELS.map((l) => l.id);

/** In the browser. */
export function loadSave(): Save {
	return readSave(GAME, ids(), 'forage:v1');
}

/** In the browser. */
export function persist(save: Save) {
	writeSave(GAME, ids(), save);
}

/** On the server: the save from the request's cookie. */
export function saveFromCookie(value: string | undefined): Save {
	return decode(value, ids());
}
