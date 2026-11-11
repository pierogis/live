/* Mosaic's saved progress: one small cookie, so the server can resume your level too. */
import { gameSave, type GameOption } from '../shared/save';
import LIST from 'virtual:level-list/mosaic';

/** Mosaic's settings, toggled on its murals page. */
const OPTIONS: GameOption[] = [{ key: 'relaxed', label: 'bigger tray' }];

/** See gameSave in shared/save.ts. */
export const mosaicSave = gameSave('mosaic', () => LIST, OPTIONS);
