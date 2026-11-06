/* Mosaic's saved progress: one small cookie, so the server can resume your level too. */
import { gameSave, type GameOption } from '../shared/save';
import { LEVELS } from './levels/index';

/** Mosaic's settings, toggled on its pictures page. */
const OPTIONS: GameOption[] = [
	{
		key: 'relaxed',
		label: 'relaxed mode',
		note: 'a much bigger tray, so you can lift dots freely'
	}
];

/** See gameSave in shared/save.ts. */
export const mosaicSave = gameSave('mosaic', () => LEVELS, OPTIONS);
