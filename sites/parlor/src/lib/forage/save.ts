/* Forage's saved progress: one small cookie, so the server can resume your level too. */
import { gameSave } from '../shared/save';
import { LEVELS } from './levels/index';

/** See gameSave in shared/save.ts. */
export const forageSave = gameSave('forage', () => LEVELS);
